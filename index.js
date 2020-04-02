const {Equation, Expression} = rwalgebra;
const ADD = 'add';
const SUBTRACT = 'subtract';
const MULTIPLY = 'multiply';
const DIVIDE = 'divide';


const parseExpression = () => {
	const exp_str = document.getElementById('expression').value
	let exp = new Expression(exp_str);

	document.getElementById('expression-json').innerText = JSON.stringify(exp, undefined, 2);
	document.getElementById('cartesian-output').innerText = `Cartesian: ${exp}`;
	document.getElementById('polar-output').innerText = `Polar: ${exp.toPolar()}`;
	return false;
};

const computeOperation = () => {
	const operator = document.getElementById('operator').value
	let operand1 = document.getElementById('operand-1').value
	const operand2 = document.getElementById('operand-2').value
	
	if (!operator.length || !operand1.length || !operand2.length)
		alert('ERROR: Must select and operator and operands!');

	operand1 = new Expression(operand1);
	
	switch (operator) {
		case ADD:
			operand1.add(operand2);
			break;
		case SUBTRACT:
			operand1.subtract(operand2);
			break;
		case MULTIPLY:
			operand1.multiply(operand2);
			break;	
		case DIVIDE:
			operand1.divide(operand2);
			break;	
	}

	document.getElementById('operation-output').innerText = `Output: ${operand1}`;
	return false;
};

const evaluateExpression = () => {
	let exp_str = document.getElementById('evaluation-expression').value;
	let var_str = document.getElementById('evaluation-variables').value;

	let exp = new Expression(exp_str);
	console.log(`evaluating: ${var_str}`);
	let variables = {};
	try {
			variables = JSON.parse(var_str);
			let evaluated = exp.eval(variables);
			document.getElementById('evaluation-output').innerText = `Output: ${evaluated}`;
	} catch (ex) {
		console.log(ex);
		alert('ERROR: Invalid JSON syntax!');
	}
};


