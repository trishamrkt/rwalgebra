var Fraction = function (n, d) {
  // Error if the denominator is zero
  if (d === 0) {
    throw new EvalError("Dividing by Zero");
  } else {
    // this.numer = new Expression(n);
    // this.denom = new Expression(d);
    this.numer = n;
    this.denom = d;
  }
};

// In case it needs to be modified 
// Without touching the actual object
Fraction.prototype.copy = function () {
  let numer = this.numer;
  let denom = this.denom;

  if (typeof this.denom !== 'number')
    denom = this.denom.copy();
  return new Fraction(numer, denom);
};


Fraction.prototype.toString = function () {
  var numer = this.numer;
  var denom = this.denom;

  // Numerator is 0 then the fraction itself is 0
  if (numer === 0) {
    return "0";
  } else {
    return numer + "/" + denom;
  }
};

// (function main() {
//   var n = [
//     '3',
//     'A + B + x1'  ];
//   var d = [
//     'D - C - x2',
//     'E - B - x2',];

//   for (let i = 0; i < n.length; i++) {
//     test = new Fraction(n[i], d[i]);
//     console.log(test);
//     // console.log(test.toString);
//   }
// })();

module.exports = { Fraction };
