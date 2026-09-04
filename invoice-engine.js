/* ==========================================================
   assets/js/invoice-engine.js

   Pure calculation engine for the TickmarkTools Invoice Generator.
   No DOM access, no globals besides the single export below —
   this file is unit-tested directly under Node (see
   /scripts/test-invoice-engine.js) and included as-is in the
   browser via <script src="assets/js/invoice-engine.js">.

   All money math is done in integer CENTS to avoid classic
   JavaScript floating-point errors (e.g. 19.99 * 3 !== 59.97
   with naive float math). Every public function returns plain
   numbers rounded to 2 decimal places — never NaN, never
   Infinity, never a negative total caused by bad input.
========================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.InvoiceEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ------------------------------------------------------------------
  // Currency configuration — scalable: add a new entry to support a
  // new currency without touching any other code in this file.
  // ------------------------------------------------------------------
  var CURRENCIES = {
    USD: { code: 'USD', symbol: '$', decimals: 2, position: 'before', name: 'US Dollar' },
    GBP: { code: 'GBP', symbol: '£', decimals: 2, position: 'before', name: 'British Pound' },
    CAD: { code: 'CAD', symbol: 'CA$', decimals: 2, position: 'before', name: 'Canadian Dollar' },
    AUD: { code: 'AUD', symbol: 'A$', decimals: 2, position: 'before', name: 'Australian Dollar' },
    NZD: { code: 'NZD', symbol: 'NZ$', decimals: 2, position: 'before', name: 'New Zealand Dollar' },
    EUR: { code: 'EUR', symbol: '€', decimals: 2, position: 'after', name: 'Euro' }
  };

  var MAX_SAFE_AMOUNT = 1e12; // 1 trillion — sanity ceiling, not a real-world limit

  // ------------------------------------------------------------------
  // Safe numeric helpers
  // ------------------------------------------------------------------

  /** Coerces any input to a finite, non-negative number (defaults to 0). */
  function safeNumber(value, opts) {
    opts = opts || {};
    var n = typeof value === 'number' ? value : parseFloat(value);
    if (!isFinite(n) || isNaN(n)) n = 0;
    if (!opts.allowNegative && n < 0) n = 0;
    if (typeof opts.min === 'number' && n < opts.min) n = opts.min;
    if (typeof opts.max === 'number' && n > opts.max) n = opts.max;
    if (Math.abs(n) > MAX_SAFE_AMOUNT) n = n < 0 ? -MAX_SAFE_AMOUNT : MAX_SAFE_AMOUNT;
    return n;
  }

  /** Converts a decimal amount to integer cents (rounded). */
  function toCents(amount) {
    return Math.round(safeNumber(amount, { allowNegative: true }) * 100);
  }

  /** Converts integer cents back to a 2-decimal float. */
  function fromCents(cents) {
    if (!isFinite(cents) || isNaN(cents)) cents = 0;
    return Math.round(cents) / 100;
  }

  // ------------------------------------------------------------------
  // Validation — user-facing, returns field-level errors. The
  // calculation functions below are always defensive on their own
  // (they never throw / never produce NaN) but this is what the UI
  // should call first to show a helpful, specific error message.
  // ------------------------------------------------------------------
  function validateItems(items) {
    var errors = [];
    if (!Array.isArray(items) || items.length === 0) {
      errors.push({ field: 'items', message: 'Add at least one line item.' });
      return errors;
    }
    items.forEach(function (item, i) {
      var qty = parseFloat(item.quantity);
      var price = parseFloat(item.unitPrice);
      if (!item.description || !String(item.description).trim()) {
        errors.push({ field: 'items[' + i + '].description', message: 'Line ' + (i + 1) + ': description is required.' });
      }
      if (item.quantity === '' || item.quantity === null || item.quantity === undefined || isNaN(qty)) {
        errors.push({ field: 'items[' + i + '].quantity', message: 'Line ' + (i + 1) + ': quantity must be a number.' });
      } else if (qty < 0) {
        errors.push({ field: 'items[' + i + '].quantity', message: 'Line ' + (i + 1) + ': quantity cannot be negative.' });
      } else if (!isFinite(qty)) {
        errors.push({ field: 'items[' + i + '].quantity', message: 'Line ' + (i + 1) + ': quantity is too large.' });
      }
      if (item.unitPrice === '' || item.unitPrice === null || item.unitPrice === undefined || isNaN(price)) {
        errors.push({ field: 'items[' + i + '].unitPrice', message: 'Line ' + (i + 1) + ': unit price must be a number.' });
      } else if (price < 0) {
        errors.push({ field: 'items[' + i + '].unitPrice', message: 'Line ' + (i + 1) + ': unit price cannot be negative.' });
      } else if (!isFinite(price) || price > MAX_SAFE_AMOUNT) {
        errors.push({ field: 'items[' + i + '].unitPrice', message: 'Line ' + (i + 1) + ': unit price is unrealistically large.' });
      }
    });
    return errors;
  }

  function validateInvoice(input) {
    var errors = validateItems(input.items);
    var discountValue = parseFloat(input.discountValue);
    if (input.discountValue !== undefined && input.discountValue !== '' && !isNaN(discountValue)) {
      if (discountValue < 0) errors.push({ field: 'discountValue', message: 'Discount cannot be negative.' });
      if (input.discountType === 'percent' && discountValue > 100) {
        errors.push({ field: 'discountValue', message: 'Percentage discount cannot exceed 100%.' });
      }
    }
    var taxRate = parseFloat(input.taxRate);
    if (input.taxRate !== undefined && input.taxRate !== '' && !isNaN(taxRate)) {
      if (taxRate < 0) errors.push({ field: 'taxRate', message: 'Tax rate cannot be negative.' });
      if (taxRate > 100) errors.push({ field: 'taxRate', message: 'Tax rate over 100% is not supported.' });
    }
    var shipping = parseFloat(input.shipping);
    if (input.shipping !== undefined && input.shipping !== '' && !isNaN(shipping) && shipping < 0) {
      errors.push({ field: 'shipping', message: 'Shipping/extra charges cannot be negative.' });
    }
    if (input.issueDate && input.dueDate) {
      var issue = parseDateOnly(input.issueDate);
      var due = parseDateOnly(input.dueDate);
      if (issue && due && due < issue) {
        errors.push({ field: 'dueDate', message: 'Due date cannot be before the issue date.' });
      }
    }
    return errors;
  }

  // ------------------------------------------------------------------
  // Core calculation
  // ------------------------------------------------------------------

  /**
   * @param {Object} input
   * @param {Array}  input.items - [{ description, quantity, unitPrice, taxable }]
   * @param {String} input.discountType - 'percent' | 'fixed'
   * @param {Number} input.discountValue
   * @param {Number} input.taxRate - percent, applied to taxable items only
   * @param {Number} input.shipping - fixed additional charge
   * @param {Number} input.amountPaid
   * @returns {Object} fully-resolved, rounded invoice totals (never NaN/Infinity)
   */
  function calculateInvoice(input) {
    input = input || {};
    var items = Array.isArray(input.items) ? input.items : [];

    var lineItems = items.map(function (item) {
      var qty = safeNumber(item.quantity);
      var price = safeNumber(item.unitPrice);
      var taxable = item.taxable !== false; // default true
      var lineCents = toCents(qty * price);
      return {
        description: item.description || '',
        quantity: qty,
        unitPrice: price,
        taxable: taxable,
        lineTotal: fromCents(lineCents),
        _lineCents: lineCents
      };
    });

    var subtotalCents = lineItems.reduce(function (sum, li) { return sum + li._lineCents; }, 0);
    var taxableSubtotalCents = lineItems.reduce(function (sum, li) {
      return sum + (li.taxable ? li._lineCents : 0);
    }, 0);

    var discountType = input.discountType === 'fixed' ? 'fixed' : 'percent';
    var discountValue = safeNumber(input.discountValue, { max: discountType === 'percent' ? 100 : MAX_SAFE_AMOUNT });

    var discountCents;
    if (discountType === 'percent') {
      discountCents = Math.round(subtotalCents * (discountValue / 100));
    } else {
      discountCents = toCents(discountValue);
    }
    // Never allow a discount to exceed the subtotal or go negative.
    discountCents = Math.max(0, Math.min(discountCents, subtotalCents));

    var afterDiscountCents = subtotalCents - discountCents;

    // Allocate the discount proportionally across taxable vs non-taxable
    // items so tax is computed on the correct (discounted) taxable base.
    var discountRatio = subtotalCents > 0 ? discountCents / subtotalCents : 0;
    var taxableAfterDiscountCents = Math.round(taxableSubtotalCents * (1 - discountRatio));

    var taxRate = safeNumber(input.taxRate, { max: 100 });
    var taxCents = Math.round(taxableAfterDiscountCents * (taxRate / 100));

    var shippingCents = toCents(safeNumber(input.shipping));

    var totalCents = afterDiscountCents + taxCents + shippingCents;

    var amountPaidCents = toCents(safeNumber(input.amountPaid));
    var balanceDueCents = totalCents - amountPaidCents;

    var status = resolvePaymentStatus({
      totalCents: totalCents,
      amountPaidCents: amountPaidCents,
      balanceDueCents: balanceDueCents,
      dueDate: input.dueDate
    });

    return {
      lineItems: lineItems,
      subtotal: fromCents(subtotalCents),
      discountType: discountType,
      discountValue: discountValue,
      discountAmount: fromCents(discountCents),
      taxableSubtotal: fromCents(taxableAfterDiscountCents),
      taxRate: taxRate,
      taxAmount: fromCents(taxCents),
      shipping: fromCents(shippingCents),
      total: fromCents(totalCents),
      amountPaid: fromCents(amountPaidCents),
      balanceDue: fromCents(balanceDueCents),
      status: status.label,
      isOverdue: status.isOverdue
    };
  }

  // ------------------------------------------------------------------
  // Dates — compared as date-only strings (YYYY-MM-DD) to avoid
  // timezone-driven off-by-one bugs from constructing Date objects.
  // ------------------------------------------------------------------
  function parseDateOnly(str) {
    if (!str || typeof str !== 'string') return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
    if (!m) return null;
    return m[1] + '-' + m[2] + '-' + m[3];
  }

  function todayDateOnly() {
    var d = new Date();
    var y = d.getFullYear();
    var mo = String(d.getMonth() + 1).padStart(2, '0');
    var da = String(d.getDate()).padStart(2, '0');
    return y + '-' + mo + '-' + da;
  }

  function resolvePaymentStatus(ctx) {
    if (ctx.totalCents <= 0) {
      return { label: 'Paid', isOverdue: false };
    }
    if (ctx.balanceDueCents <= 0) {
      return { label: 'Paid', isOverdue: false };
    }
    var due = parseDateOnly(ctx.dueDate);
    var today = todayDateOnly();
    var isOverdue = !!(due && due < today);
    if (ctx.amountPaidCents > 0 && ctx.amountPaidCents < ctx.totalCents) {
      return { label: isOverdue ? 'Overdue' : 'Partially Paid', isOverdue: isOverdue };
    }
    return { label: isOverdue ? 'Overdue' : 'Unpaid', isOverdue: isOverdue };
  }

  // ------------------------------------------------------------------
  // Currency formatting
  // ------------------------------------------------------------------
  function formatCurrency(amount, currencyCode) {
    var cfg = CURRENCIES[currencyCode] || CURRENCIES.USD;
    var n = safeNumber(amount, { allowNegative: true });
    var abs = Math.abs(n).toLocaleString(undefined, {
      minimumFractionDigits: cfg.decimals,
      maximumFractionDigits: cfg.decimals
    });
    var sign = n < 0 ? '-' : '';
    return cfg.position === 'before'
      ? sign + cfg.symbol + abs
      : sign + abs + ' ' + cfg.symbol;
  }

  /** Sanitizes a string into a safe filename fragment (no illegal chars). */
  function safeFilenamePart(str) {
    return String(str || '')
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_ ]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'invoice';
  }

  return {
    CURRENCIES: CURRENCIES,
    safeNumber: safeNumber,
    toCents: toCents,
    fromCents: fromCents,
    validateItems: validateItems,
    validateInvoice: validateInvoice,
    calculateInvoice: calculateInvoice,
    formatCurrency: formatCurrency,
    safeFilenamePart: safeFilenamePart,
    parseDateOnly: parseDateOnly,
    todayDateOnly: todayDateOnly
  };
});
