const {Equation, Expression} = rwalgebra;
const ADD = 'add';
const SUBTRACT = 'subtract';
const MULTIPLY = 'multiply';
const DIVIDE = 'divide';

let DEMO_EXPRESSION = null; 

const updateDataStructure = () => {
	document.getElementById('expression-json').innerText = JSON.stringify(DEMO_EXPRESSION, undefined, 2);
};

const updateNotations = () => {
	document.getElementById('cartesian-output').innerText = `Cartesian: ${DEMO_EXPRESSION}`;
	document.getElementById('polar-output').innerText = `Polar: ${DEMO_EXPRESSION.toPolar()}`;
}

const parseExpression = () => {
	const exp_str = document.getElementById('expression').value
	DEMO_EXPRESSION = new Expression(exp_str);
	updateDataStructure();
	updateNotations();
	return false;
};

const computeOperation = () => {
	const operator = document.getElementById('operator').value
	const operand = document.getElementById('operand').value
	
	if (!operator.length || !operand.length)
		alert('ERROR: Must select and operator and operand!');

	if (DEMO_EXPRESSION === null)
		alert('ERROR: Please enter an expression string first!');
	
	switch (operator) {
		case ADD:
			DEMO_EXPRESSION.add(operand);
			break;
		case SUBTRACT:
			DEMO_EXPRESSION.subtract(operand);
			break;
		case MULTIPLY:
			DEMO_EXPRESSION.multiply(operand);
			break;	
		case DIVIDE:
			DEMO_EXPRESSION.divide(operand);
			break;	
	}
	updateDataStructure();
	updateNotations();
	document.getElementById('operation-output').innerText = `Output: ${DEMO_EXPRESSION}`;
	return false;
};

const evaluateExpression = () => {
	let var_str = document.getElementById('evaluation-variables').value;
	console.log(`evaluating: ${var_str}`);
	let variables = {};
	try {
			variables = JSON.parse(var_str);
			let evaluated = DEMO_EXPRESSION.eval(variables);
			document.getElementById('evaluation-output').innerText = `Output: ${evaluated}`;
	} catch (ex) {
		console.log(ex);
		alert('ERROR: Invalid JSON syntax!');
	}
};


