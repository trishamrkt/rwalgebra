const { Variable, Term } = require('./TermVariable.js');
const { Fraction } = require('./Fraction.js');
const { TOKEN_TYPES, tokenize } = require ('./token.js');

const PRECEDENCE = {
  '+': 2,
  '-': 2,   // Left
  '/': 3,   // Left
  '*': 3,   // Left
  '^': 4    // Right
};

/**
 * Executes the Shunting-Yard algorithm
 * Reorders tokens into POSTFIX notation - facilitates parsing expressions with parentheses
 *
 * Reference: https://en.wikipedia.org/wiki/Shunting-yard_algorithm#The_algorithm_in_detail
 *
 * @param tokens
 */
const shuntingYard = (tokens) => {
  let output_q = [];  // list of tokens in post-fix notation
  let op_stack = [];  // operator stack

  let t, op_top;
  while(tokens.length) {
    t = tokens.shift();
    if (t.type === TOKEN_TYPES.LITERAL || t.type === TOKEN_TYPES.VAR || t.type === TOKEN_TYPES.IMAG_LIT || t.type === TOKEN_TYPES.IMAG_VAR)
      output_q.push(t);

    else if (t.type === TOKEN_TYPES.FUNC)
      op_stack.push(t);

    else if (t.type === TOKEN_TYPES.OP) {
      op_top = op_stack[op_stack.length-1];
      while(op_stack.length && (op_top.type === TOKEN_TYPES.FUNC || PRECEDENCE[t.value] < PRECEDENCE[op_top.value]
        || (PRECEDENCE[t.value] === PRECEDENCE[op_top.value] && op_top.value !== '^'))
        && op_top.type !== TOKEN_TYPES.LEFTPAR) {
        output_q.push(op_stack.pop());
        op_top = op_stack[op_stack.length-1];
      }
      op_stack.push(t);
    }

    else if (t.type === TOKEN_TYPES.LEFTPAR) {
      op_stack.push(t);
    }

    else if (t.type === TOKEN_TYPES.RIGHTPAR) {
      op_top = op_stack[op_stack.length-1];
      while (op_stack.length && op_top.type !== TOKEN_TYPES.LEFTPAR) {
        output_q.push(op_stack.pop());
        op_top = op_stack[op_stack.length-1];
      }
      if (op_top.type === TOKEN_TYPES.LEFTPAR) {
        op_stack.pop()
      } else {
        throw new ArgumentsError('Mismatched Parentheses!!!');
      }
    }
  }

  if (!tokens.length) {
    while (op_stack.length) {
      output_q.push(op_stack.pop());
    }
  }
  return output_q;
};

module.exports = { shuntingYard };