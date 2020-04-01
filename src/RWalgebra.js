const { Variable, Term } = require('./TermVariable.js');
const { TOKEN_TYPES, tokenize } = require ('./token.js');
const { shuntingYard } = require('./parseHelper.js');

const RAD_TO_DEG = 180 / Math.PI;
const ADD = '+';
const SUB = '-';
const MULT = '*';
const DIV = '/';
const POW = '^';
const EQUAL = '=';
const SQRT = 'sqrt';
const LOG_10 = 'log10';
const ATAN = 'atan'
const IMAG_NUM = 'j';
const SUPPORTED_FUNCS = ['sin', 'cos', 'tan', 'log'];
const SUPPORTED_OPS = [ADD, SUB, MULT, DIV, POW];
const SUPPORTED_VAR_CHARS = ['_']; // special chars that are allowed in variable names

const DEBUG = 0;


const Expression = function (exp) {
  this.imag = { terms: [], constant: null };   /* List of Terms */
  this.real = { terms: [], constant: null };   /* List of Terms */

  if ( typeof exp === 'string' ) {
    const tokens = tokenize(exp);
    this.parse(tokens);
  }
  else if ( typeof exp === 'number')
  {
    this.real.constant = parseFloat(exp);
  }
  else if (Array.isArray(exp) && exp[0] instanceof Term) { // array of Terms
    let real_const = computeConstant(exp, false);
    let imag_const = computeConstant(exp, true);
    this.real.terms = filterOutConstantTerms(exp, false);
    this.real.constant = real_const === null ? 0 : real_const;
    this.imag.terms = filterOutConstantTerms(exp, true);
    this.imag.constant = imag_const === null ? 0 : imag_const;
  }
  else if (exp === undefined) {
    // do nothing
  }
  else {
    console.log(exp);
    throw new ArgumentsError('Invalid argument type for Expression object');
  }
};

Expression.prototype.copy = function() {
  let copy = new Expression();
  copy.real.terms = this.real.terms.map(t => t.copy());
  copy.imag.terms = this.imag.terms.map(t => t.copy());
  copy.real.constant = this.real.constant;
  copy.imag.constant = this.imag.constant;
  return copy;
};


/**
 * Returns TRUE if the expression contains an imaginary portion
 * FALSE otherwise
 *
 * @returns {number | boolean}
 */
Expression.prototype.isComplex = function() {
  return (this.imag.terms.length !== 0 || (this.imag.constant !== null && this.imag.constant !== 0))
};


/**
 * String parser that initializes the Expression data structure
 * Only called in the constructor when creating the Expression object
 *
 * @param tokens
 */
Expression.prototype.parse = function(tokens) {
  /* Perform Shunting-Yard algorithm to convert tokens from in-fix to post-fix notation */
  const postFix = shuntingYard(tokens);
  if (DEBUG)
    console.log(postFix);

  /* Loop through all - the end result should be a single array of terms in the operand_stack */
  let operand_stack = [];
  let op1, op2;
  let term;
  postFix.forEach( t => {
    if (t.type === TOKEN_TYPES.OP) {
      op2 = operand_stack.pop();
      op1 = operand_stack.pop();
      let result = compute(op1, op2, t.value);
      operand_stack.push(result);
    }
    else if (t.type === TOKEN_TYPES.LITERAL) {
      term = new Term();
      term.coefficient = parseFloat(t.value);
      operand_stack.push([term]);
    }
    else if (t.type === TOKEN_TYPES.VAR) {
      operand_stack.push([new Term(t.value)]);
    }
    else if (t.type === TOKEN_TYPES.IMAG_LIT) {
      term = new Term();
      term.coefficient = parseFloat(t.value);
      term.imag = true;
      operand_stack.push([term]);
    }
    else if (t.type === TOKEN_TYPES.IMAG_VAR) {
      term = new Term(new Variable(t.value));
      term.imag = true;
      operand_stack.push([term]);
    }
  });

  /* Must compute the constant term and filter out the constant terms from the result */
  this.termsToExpression(operand_stack[0]);
};


/**
 * Given a list of terms, computes the constant term by adding all terms that do not contain any variables
 *
 * @param terms List of terms
 * @returns float if terms.length != 0, null otherwise
 */
const computeConstant = (terms, _imag) => {
  terms = terms.filter( t => !t.variables.length && typeof t.fraction.numer === 'number' &&
    typeof t.fraction.denom === 'number' && t.imag === _imag && t.coefficient !== 0);
  return terms.length ? terms.reduce( (acc, curr) => acc + curr.coefficient / curr.fraction.denom, 0) : null;
};

const filterOutConstantTerms = (terms, _imag) => {
  return terms.filter(t => (t.variables.length || typeof t.fraction.denom !== 'number')
    && t.imag === _imag && t.coefficient !== 0 );
};

/**
 * Given a list of terms - combine likes terms
 * i.e. x + 2x -> 3x
 *
 * Note: if there are expressions in the denominator - will not combine
 * i.e. x / (x + 2) + x / ( x + 3) -> no simplification
 *
 * @param terms
 */
const simplify = (terms) => {
  let vars = { }; // key = var name, val = Term object
  let f = [];
  let i = [new Term()]; // list of constant imaginary terms
  let r = [new Term()]; // list of constant real terms
  let v_names;

  i[0].coefficient = 0;
  i[0].imag = true;
  r[0].coefficient = 0;
  terms.forEach( t => {
    /*
     * SUPER SPECIAL CASE: if all the variables in an expression cancel out
     */
    if (typeof t.fraction.denom !== 'number') {
      let term_exp = new Expression([t.copy()]);
      let evaluated = term_exp.eval({w: Math.random()});
      if (evaluated === 1) {
        r[0].coefficient += 1;
        return;
      }
    }


    if (!t.variables.length) { // no variables
      if (typeof t.fraction.denom !== 'number')
        f.push(t);
      else if (t.imag)
        i[0].coefficient += t.coefficient;
      else
        r[0].coefficient += t.coefficient;
      return;
    }
    v_names = t.variables.map(v => v.name + v.degree).sort().join('') + t.imag;
    if (!vars[v_names])
      vars[v_names] = t;
    else  { // need to combine variables
      let _t = vars[v_names];
      // terms with variables in the denominator will not be simplified - too complex
      if (typeof t.fraction.denom === 'number' && typeof _t.fraction.denom === 'number') {
        _t.coefficient += t.coefficient;
      } else {
        f.push(t);
      }
    }
  });


  let ret = Object.keys(vars).map( v => vars[v]).concat(f);
  if (i[0].coefficient)
    ret = ret.concat(i);
  if (r[0].coefficient)
    ret = ret.concat(r);
  return ret;
};


/**
 * Returns a list of Term objects representing the computation of
 * op1 operator op2
 *
 * @param op1   - OPERAND 1, Type: List of Terms
 * @param op2   - OPERAND 2, Type: List of Terms
 * @param operator - String in [ + , - , * , / ]
 * TODO Add support for pow() and other functions, sin, cos, etc
 */
const compute = (op1, op2, operator) => {
  let result = [];
  switch (operator) {
    case (ADD):
      result = addTerms(op1, op2);
      break;
    case (SUB):
      result = subtractTerms(op1, op2); // op1 - op2
      break;
    case (MULT):
      result = multiplyTerms(op1, op2);
      break;
    case (DIV):
      result = divideTerms(op1, op2); // op1 / op2
      break;
    case (POW):
      result = powTerms(op1, op2); // op1 ^ op2 - op2 must be a float, op1 can be a SINGLE variable only
      break;
    default: // do nothing
      break;
  }
  return simplify(result);
};


/*
 * Returns true if term is a constant
 * (i.e. only the coefficient field is populated)
 */
const termIsConstant = (term) => {
  return !(term.imag || term.variables.length || typeof term.fraction.denom !== 'number');
};

/**
 * Helper functions to perform ADD, SUB, MULT, DIVIDE, POW functions
 * Each takes 2 arguments: op1, op2 -- both are a LIST OF TERMS
 * **/
const addTerms = (op1, op2) => {
  let _op2 = [];
  op2.forEach(t => _op2.push(t.copy()));
  return op1.concat(_op2);
};

const subtractTerms = (op1, op2) => {
  let _op2 = [];
  op2.forEach( t => {
    let _t = t.copy();
    _t.coefficient *= -1;
    _op2.push(_t);
  });
  return op1.concat(_op2);
};

const powTerms = (op1, op2) => {
  if (op1.length !== 1 || op2.length !== 1)
    throw new Error("Currently only support single variable exponentiation (i.e. x^4 not (x+1)^4)!");

  _op1 = op1[0];
  _op2 = op2[0];

  if (!termIsConstant(_op2))
    throw new Error('Only support floating point numbers as exponents!');

  _op1.coefficient = Math.pow(_op1.coefficient, _op2.coefficient);
  _op1.variables.forEach( v => {
    v.degree *= _op2.coefficient;
  });

  return op1;
};


const mergeVariables = (v1, v2) => {
  let _v1 = {};
  let _v2 = {};

  v1.forEach( v => _v1[v.name] = v.copy() );
  v2.forEach( v => _v2[v.name] = v.copy() );

  let name;
  v1.forEach( v => {
    name = v.name;
    if (_v2[name]) {
      _v1[name].degree += _v2[name].degree;
      delete _v2[name];
    }
  });

  let merged = [];
  let _merge = function(_v) {
    for (const v of Object.keys(_v)) {
      merged.push(_v[v])
    }
  };

  _merge(_v1);
  _merge(_v2);
  return merged;
};

const multiplyTerms = (op1, op2) => {
  if (DEBUG) {
    console.log('============================');
    console.log(`multiplying ${JSON.stringify(op1)} && ${JSON.stringify(op2)}`);
  }

  let result = [];
  let temp_term;
  op1.forEach( t1 => {
    op2.forEach( t2 => {
      temp_term = new Term();
      temp_term.variables = mergeVariables(t1.variables, t2.variables);
      temp_term.coefficient = t1.coefficient * t2.coefficient;
      if (t1.imag && t2.imag) // j * j = -1
        temp_term.coefficient *= -1;
      else if (t1.imag || t2.imag) // j * const  or const * j = imaginary term
        temp_term.imag = true;

      // Need to handle denominator multiplication
      if (typeof t1.fraction.denom !== 'number' && typeof t2.fraction.denom !== 'number') // expression * expression
        temp_term.fraction.denom = t1.fraction.denom.copy().multiply(t2.fraction.denom);
      else if (typeof t1.fraction.denom !== 'number') // expression * const
        temp_term.fraction.denom = t1.fraction.denom.copy();
      else if (typeof t2.fraction.denom !== 'number') // const * expression
        temp_term.fraction.denom = t2.fraction.denom.copy();

      result.push(temp_term);
    });
  });
  return result;
};

Expression.prototype.conjugate = function() {
  let conjugate = this.copy();
  conjugate.imag.constant *= -1;
  conjugate.imag.terms.forEach(t => {
    t.coefficient *= -1;
  });
  return conjugate;
};

const divideTerms = (op1, op2) => {
  /* Case 1: term / term */
  if (op1.length === 1 && op2.length === 1) {
    /* if denom is a constant - just update the coefficient */
    if (computeConstant(op2, false) !== null) {
      op1[0].coefficient = op1[0].coefficient / computeConstant(op2, false);
      return op1;
    }


    // multiply denominator of op1 and op2
    op1[0].fraction.denom = (new Expression(op2)).multiply(op1[0].fraction.denom);

    /*
     * If the divisor (op2) is imaginary, must multiply by the conjugate of the
     * denominator of op1 so that there are no 'j's' in the denominator
     */
    if (op2[0].imag) {
      const conjugate = op1[0].fraction.denom.conjugate();
      op1[0].fraction.denom.multiply(conjugate);
      op1 = multiplyTerms(op1, convertToTerms(conjugate));
    }
    return op1;
  }

  /* Case 2: multiple terms / term */
  else if (op1.length > 1 && op2.length === 1) {
    let _const = computeConstant(op2, false); // term is a constant
    let _op1 = []; // final result
    op1.forEach( t => {
      if (_const !== null) {
        t.coefficient = t.coefficient /_const;
        _op1.push(t);
      } else {
        if (typeof t.fraction.denom === 'number')
          t.fraction.denom = new Expression(op2);
        else
          t.fraction.denom.multiply(new Expression(op2));

        // If term is imaginary - multiply top and bottom by conjugate (term * -1)
        if (op2[0].imag) {
          const conjugate = t.fraction.denom.conjugate();
          t.fraction.denom.multiply(conjugate);
          let terms = multiplyTerms([t], convertToTerms(conjugate));
          _op1 = _op1.concat(terms);
        } else {
          _op1.push(t);
        }
      }
    });
    return _op1;
  }

  /* Case 3: term / multiple terms */
  else if (op1.length === 1 && op2.length > 1) {
    let denom = new Expression(op2);
    op1[0].fraction.denom = denom.multiply(op1[0].fraction.denom);

    // If the denominator expression contains an imaginary term, must multiply top and bottom by conjugate
    if ((denom.imag.constant !== 0 && denom.imag.constant !== null) || denom.imag.terms.length) {
      const conjugate = denom.conjugate();
      op1[0].fraction.denom = denom.multiply(conjugate);
      op1 = multiplyTerms(op1, convertToTerms(conjugate));
    }
    return op1;
  }

  /* Case 4: multiple terms / multiple terms */
  else if (op1.length > 1 && op2.length > 1) {
    let _op1 = []; // final result
    op1.forEach( t => {
      t.fraction.denom = (new Expression(op2)).multiply(t.fraction.denom);

      /*
       * If any of the terms in the denominator expression contain
       * imaginary numbers, must multiply top and bottom by conjugate
       */
      let denom = t.fraction.denom;
      if ((denom.imag.constant !== 0 && denom.imag.constant !== null) || denom.imag.terms.length) {
        const conjugate = denom.conjugate();
        t.fraction.denom.multiply(conjugate);
        let terms = multiplyTerms([t], convertToTerms(conjugate));
        _op1 = _op1.concat(terms);
      } else {
        _op1.push(t);
      }

    });
    return _op1;
  }
};

/**
 * EXPRESSION INTERFACE FUNCTIONS
 * Valid Inputs:
 * *  Variable ('x', 'y', 'z')
 * *  Expression/ string of an expression
 * *  Constant - Integer/floating point
 */
Expression.prototype.add = function(op) {
  if (typeof op === 'number')
    this.real.constant += op;
  else if (op instanceof Variable) { // variables can only be real
    this.real.terms.push(new Term(op));
  }
  else if (op instanceof Term) {
    if (op.imag) {
      this.imag.terms.push(op);
      this.imag.terms = simplify(this.imag.terms);
    }
    else {
      this.real.terms.push(op);
      this.real.terms = simplify(this.real.terms);
    }
  }
  else  {
    if (typeof op !== 'string' && !(op instanceof Expression))
      throw new ArgumentsError('Invalid arguments');
    let exp = typeof op === 'string' ? new Expression(op) : op;
    this.imag.terms = simplify(addTerms(this.imag.terms, exp.imag.terms)).filter(t => t.coefficient !== 0);;
    this.imag.constant += exp.imag.constant;
    this.real.terms = simplify(addTerms(this.real.terms, exp.real.terms)).filter(t => t.coefficient !== 0);;
    this.real.constant += exp.real.constant;
  }
  return this;
};

Expression.prototype.subtract = function(op) {
  if (typeof op === 'number')
    this.real.constant -= op;
  else if (op instanceof Variable) { // variables can only be real
    let term = new Term(op);
    term.coefficient *= -1;
    this.real.terms.push(term);
    this.real.terms = simplify(this.real.terms);
  }
  else  {
    let exp = typeof op === 'string' ? new Expression(op) : op;
    this.imag.terms = simplify(subtractTerms(this.imag.terms, exp.imag.terms)).filter(t => t.coefficient !== 0);;
    this.imag.constant -= exp.imag.constant;
    this.real.terms = simplify(subtractTerms(this.real.terms, exp.real.terms)).filter(t => t.coefficient !== 0);;
    this.real.constant -= exp.real.constant;
  }
  return this;
};

/**
 * Converts Expression object to a list of terms by combining
 * imaginary and real terms. Converts constants into terms and
 * includes in the result.
 * Required for multiply and divide interface functions.
 *
 * @param exp
 * @returns [] list of Term objects
 */
const convertToTerms = (exp) => {
  let terms = [];
  terms = terms.concat(exp.real.terms);
  terms = terms.concat(exp.imag.terms);

  // convert the constants into terms
  let term;
  if (exp.real.constant !== 0 && exp.real.constant !== null) {
    term = new Term();
    term.coefficient = exp.real.constant;
    terms.push(term);
  }

  if (exp.imag.constant !== 0 && exp.imag.constant !== null) {
    term = new Term();
    term.coefficient = exp.imag.constant;
    term.imag = true;
    terms.push(term);
  }

  return terms;
};

Expression.prototype.divide = function(op) {
  let terms_1 = convertToTerms(this); // dividend
  let terms_2 = []; // divisor
  if (typeof op === 'number') {
    let term = new Term();
    term.coefficient = op;
    terms_2.push(term);
  }
  else if (op instanceof Variable) { // variables can only be real
    terms_2.push(new Term(op));
  }
  else  {
    if (typeof op === 'string') {
      op = new Expression(op);
    }
    terms_2 = convertToTerms(op);
  }
  const result = divideTerms(terms_1, terms_2);
  this.termsToExpression(result);
  return this;
};

Expression.prototype.multiply = function(op) {
  let terms_1 = convertToTerms(this); // op1
  let terms_2 = []; // op2
  if (typeof op === 'number') {
    let term = new Term();
    term.coefficient = op;
    terms_2.push(term);
  }
  else if (op instanceof Variable) { // variables can only be real
    terms_2.push(new Term(op));
  }
  else  {
    if (typeof op === 'string') {
      op = new Expression(op);
    }
    terms_2 = convertToTerms(op);
  }
  const result = simplify(multiplyTerms(terms_1, terms_2));
  this.termsToExpression(result);
  return this;
};

/**
 * Returns the inverse of the expression
 * Note it does NOT the expression itself does not change by calling this function
 */
Expression.prototype.inverse = function(){
  var numer = new Expression(1);
  return numer.divide(this);
};

/**
 * Extracts Expression object fields from a list of terms
 *
 * @param terms
 */
Expression.prototype.termsToExpression = function(terms) {
  let real_const = computeConstant(terms, false);
  let imag_const = computeConstant(terms, true);
  this.real.terms = filterOutConstantTerms(terms, false);
  this.real.constant = real_const === null ? 0 : real_const;
  this.imag.terms = filterOutConstantTerms(terms, true);
  this.imag.constant = imag_const === null ? 0 : imag_const;
};

/**
 * Given an object of the form {'var_name': <floating_point> }
 * Evaluates the expression by substituting the input variables
 * Returns an Expression object
 *
 * NOTE: only accepts floating point values for substitutions, no complex numbers or variables/expressions
 *
 * @param sub
 * @return Expression or floating point
 */
Expression.prototype.eval = function(sub) {
  let result = new Expression();

  const real = (this.real.terms.reduce((acc, curr) => {return acc.add(curr.eval(sub))}, result)).real.terms;
  const imag = (this.imag.terms.reduce((acc, curr) => {return acc.add(curr.eval(sub))}, result)).imag.terms;

  result.termsToExpression(real.concat(imag));
  result.real.constant += this.real.constant === null ? 0 : this.real.constant;
  result.imag.constant += this.imag.constant === null ? 0 : this.imag.constant;

  if (!result.real.terms.length && !result.imag.terms.length && (result.imag.constant === 0 || result.imag.constant === null))
    return result.real.constant;
  else
    return result;
};

/**
 * Returns the phase of the function of the expression object in degrees
 * Conversion from rad to deg:
 *    x * (180 / pi)
 * Phase formula:
 *    tan_inverse(imag / real) * (180 / pi)
 */
Expression.prototype.phase = function() {
  const copy = this.copy();
  const terms = convertToTerms(copy);
  const real_terms = terms.filter(t => !t.imag);
  const imag_terms = terms.filter(t => t.imag);
  imag_terms.forEach( t => t.imag = false );

  /* Special cases: real = 0 or imag = 0 */
  if (!imag_terms.length)
    return 0;
  if (!real_terms.length)
    return 90;

  const imag = new Expression(imag_terms);
  const real = new Expression(real_terms);
  return `atan((${imag.toString()}) / (${real.toString()})) * 180 / pi`;
};

/**
 * Returns the magnitude function of the expression object in dB
 * Formula: 20 * log10 (sqrt(real^2 + imag^2))
 *
 * @returns {string}
 */
Expression.prototype.magnitude = function() {
  if (!this.real.terms.length && !this.imag.terms.length
      && (this.real.constant === 0 || this.real.constant === null)
      && (this.imag.constant === 0 || this.imag.constant === null))
    return '0';
  const copy = this.copy();
  const terms = convertToTerms(copy);
  const real = terms.filter(t => !t.imag);
  const imag = terms.filter(t => t.imag);
  imag.forEach( t => t.imag = false );
  // const real_squared = multiplyTerms(real, real); // compute a^2
  // const imag_squared = multiplyTerms(imag, imag); // compuate b^2
  // const sum = new Expression(addTerms(real_squared, imag_squared));

  let imag_exp;
  if (!imag.length) // no imaginary terms
    imag_exp = new Expression(0);
  else
    imag_exp = new Expression(imag);

  let real_exp;
  if (!real.length)
    real_exp = new Expression(0);
  else
    real_exp = new Expression(real);

  if (DEBUG) {
    console.log(`magnitude imag: ${imag_exp}`);
    console.log(`magnitude real: ${real_exp}`);
    console.log(`magnitude: 20 * ${LOG_10} ( ${SQRT}( (${real_exp})^2 + (${imag_exp})^2 ))`);
  }

  /* |T(jw)| = 20 * log10 ( sqrt(real^2 + imag^2)) */
  return `20 * ${LOG_10} ( ${SQRT}( (${real_exp})^2 + (${imag_exp})^2 ))`;
};


/**
 * Returns polar representation of expression
 * NOTE: will return NULL if the Expression object contains
 *       variables
 *
 * @returns {string}
 */
Expression.prototype.toPolar = function() {
  if (this.imag.terms.length || this.real.terms.length)
    return null;

  const _real = this.real.constant;
  const _imag = this.imag.constant;

  const magnitude = Math.sqrt(_real*_real + _imag*_imag).toFixed(3);
  let angle = Math.atan(_imag/_real) * RAD_TO_DEG;
  angle = angle < 0 ? angle + 360.0 : angle;

  return `${magnitude}∠${angle.toFixed(3)}°`;
};


Expression.prototype.toString = function () {
  return '';
};

/**
 * Equation Constructor
 * Possible Arguments:
 * 1) Single string input - new Equation('x = y + z')
 * 2) 2 Expression objects -> lhs = arg0, rhs - arg1
 *
 * @param arg0
 * @param arg1
 * @constructor
 */
const Equation = function(arg0, arg1) {
  if (arg1 === undefined) {
    if (arg0.indexOf(EQUAL) === -1)
      throw new ArgumentsError('Equation string must include "=" sign!');

    let exp = arg0.split(EQUAL);
    this.lhs = new Expression(exp[0]);
    this.rhs = new Expression(exp[1]);
  }
  else {
    if (typeof arg0 === 'string')
      arg0 = new Expression(arg0);

    if (typeof arg1 === 'string')
      arg1 = new Expression(arg1);

    this.lhs = arg0;
    this.rhs = arg1;
  }
};

Equation.prototype.toString = function() {
  return this.lhs.toString() + " = " + this.rhs.toString();
};

const parse = (str) => {
  if (str.indexOf('=') !== -1)
    return new Equation(str);
  else
    return new Expression(str);

};
const rwalgebra = { Expression, Equation, parse };
module.exports = rwalgebra;

