const { Equation, Expression, parse } = require('./RWalgebra.js');
const { Variable } = require('./TermVariable.js');
const { tokenize } = require('./token.js');

function main() {
  const exp = 'x2 - 3*y - (4*z / 12 - 17) + y - 4.5j + (4*x_3 - 2)/(5-12*some_var) + sin(x_3)';
  const simple = 100;
  const no_vars = '5 + 7 * 9 - 10/10 +37 * 0.5';
  const add_test = 'x1 + 5 + 7 + x_7';
  const sub_test = 'x1 + 5 - 7 + x_7 - test + 8.7 - x8';
  const mult_test = 'x1 * x2 + 7.9 * 10 * 2 - x_3 * 7 + 5.91 - x7 + x8 * 9 * 10.7';
  const div_test = 'x1/7 + x2/x3 + 9/7 + 7*x7/x4*8';
  const bracket_test = '(x1 + x2) * (x3 - x4) + 1 / (x1 + x2 * x3) + (x1 + x2) /(x1 + x3)';
  const circuit_test = '(15 - n2) / 12000';
  const imaginary = 'x + x_7j + 5 + 6j + j + (x2 - 10)/(x * j * j)';
  const pow = '((0.002) / (((1.6e-11) / (1.6e-11*w^ 4))*w^ 4))*n2*w*j';
  // const imaginary = '(-x)*j + (2j) + x1 + 5' ;


  // const test_type = process.argv[2];
  // let ex;
  // if (test_type === 'simple')
  //   ex = new Expression(simple);
  // else if (test_type === 'add')
  //   ex = new Expression(add_test);
  // else if (test_type === 'sub')
  //   ex = new Expression(sub_test);
  // else if (test_type === 'mult')
  //   ex = new Expression(mult_test);
  // else if (test_type === 'div')
  //   ex = new Expression(div_test);
  // else if (test_type === 'bracket')
  //   ex = new Expression(bracket_test);
  // else if (test_type === 'no_vars')
  //   ex = new Expression(no_vars);
  // else if (test_type === 'circuit')
  //   ex = new Expression(circuit_test);
  // else if (test_type === 'imag')
  //   ex = new Expression(imaginary);
  //
  // ex.divide('wj + 30');
  // console.log(JSON.stringify(ex));
  // console.log(ex.magnitude());
  // console.log(ex.phase());

  // console.log(JSON.stringify(ex));


  // let ex = new Expression('24*x2 - 98*x1 - x2');
  // console.log(JSON.stringify(ex));
  // console.log("multiplying...");
  // ex.multiply('69*x1 + 87*x1 - 93*x0');
  // console.log(JSON.stringify(ex));
  // console.log("evaluationg");
  // console.log(ex.eval({x1: 20, x0: 10, x2: 2}));
  // console.log(ex.toString());
  // console.log(ex.eval({x:1}))

  // ex.subtract('x_8j + 9j + (-9) -(8 - (-8)*j)');
  // ex.divide(5);

  // console.log(tokenize(imaginary));
  // console.log('=======================================');
  //   console.log(`Test Equation: ${circuit_test}`);
  //   // console.log('=======================================');
  //   // console.log(`Data Structure: `);
  //   // console.log(JSON.stringify(ex));
  //   // // console.log(ex.real.terms.toString());
  //   // // console.log(ex.imag.terms.toString());
  //   console.log('=======================================');
  //   console.log(`Testing toString():`);
  //   console.log(ex.toString());
  //   console.log('=======================================');
  //
  //   console.log(`Testing .add(x3j):`);
  //   ex.add('x3j');
  //   // console.log(JSON.stringify(ex));
  //   console.log(ex.toString());
  //   console.log('=======================================');
  //
  //   console.log(`Testing .subtract(5*x3j)`);
  //   ex.subtract('5*x3j');
  //   // console.log(JSON.stringify(ex));
  //   console.log(ex.toString());
  //   console.log('=======================================');
  //
  //   console.log(`Testing .multiply(12000)`);
  //   ex.multiply(12000);
  //   // console.log(JSON.stringify(ex));
  //   console.log(ex.toString());
  //   console.log('=======================================');
  //
  //   console.log(`Testing .divide(12000)`);
  //   ex.divide(12000);
  //   // console.log(JSON.stringify(ex));
  //   console.log(ex.toString());
  //
  //   console.log('=======================================');
  //   console.log(`Testing .eval({n2: 0}):`);
  //   let result = ex.eval({'n2' : 0});
  //   // console.log(JSON.stringify(ex));
  //   console.log(result.toString());

  let ex = new Expression('(0.002) / ((1.6e-11) / (1.6e-11*w^4)*w^4)*w*j + 0.25');
  console.log(ex.toString());
  console.log(ex.inverse().toString());
  console.log(ex.eval({w: 1}).toString());

};


20 * log10(sqrt(1 / 16 / (1.6e-11 * w ^ 4 + w ^ 2 / 2e+6 + 1 / 256) + w ^ 2 * 1 / 2.5e+5 / (1.6e-11 * w ^ 4 + w ^ 2 / 2e+6 + 1 / 256)))

main();
