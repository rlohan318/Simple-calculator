// Custom Compiler/Interpreter Implementation

// Lexer - Tokenizes input code
class Lexer {
    constructor(input) {
        this.input = input;
        this.position = 0;
        this.currentChar = this.input[this.position];
    }

    advance() {
        this.position++;
        this.currentChar = this.position < this.input.length ? this.input[this.position] : null;
    }

    skipWhitespace() {
        while (this.currentChar && /\s/.test(this.currentChar)) {
            this.advance();
        }
    }

    getNumber() {
        let result = '';
        while (this.currentChar && /\d/.test(this.currentChar)) {
            result += this.currentChar;
            this.advance();
        }
        return Number(result);
    }

    getIdentifier() {
        let result = '';
        while (this.currentChar && /[a-zA-Z0-9_]/.test(this.currentChar)) {
            result += this.currentChar;
            this.advance();
        }
        return result;
    }

    getNextToken() {
        while (this.currentChar) {
            if (/\s/.test(this.currentChar)) {
                this.skipWhitespace();
                continue;
            }

            if (/\d/.test(this.currentChar)) {
                return { type: 'NUMBER', value: this.getNumber() };
            }

            if (/[a-zA-Z]/.test(this.currentChar)) {
                return { type: 'IDENTIFIER', value: this.getIdentifier() };
            }

            if (this.currentChar === '=') {
                this.advance();
                return { type: 'ASSIGN', value: '=' };
            }

            if (this.currentChar === '+') {
                this.advance();
                return { type: 'PLUS', value: '+' };
            }

            if (this.currentChar === '-') {
                this.advance();
                return { type: 'MINUS', value: '-' };
            }

            if (this.currentChar === '*') {
                this.advance();
                return { type: 'MULTIPLY', value: '*' };
            }

            if (this.currentChar === '/') {
                this.advance();
                return { type: 'DIVIDE', value: '/' };
            }

            if (this.currentChar === '(') {
                this.advance();
                return { type: 'LPAREN', value: '(' };
            }

            if (this.currentChar === ')') {
                this.advance();
                return { type: 'RPAREN', value: ')' };
            }

            if (this.currentChar === ';') {
                this.advance();
                return { type: 'SEMICOLON', value: ';' };
            }

            throw new Error(`Invalid character: ${this.currentChar}`);
        }

        return { type: 'EOF', value: null };
    }
}

// Parser - Creates Abstract Syntax Tree
class Parser {
    constructor(lexer) {
        this.lexer = lexer;
        this.currentToken = this.lexer.getNextToken();
    }

    eat(tokenType) {
        if (this.currentToken.type === tokenType) {
            this.currentToken = this.lexer.getNextToken();
        } else {
            throw new Error(`Expected ${tokenType} but got ${this.currentToken.type}`);
        }
    }

    factor() {
        const token = this.currentToken;
        if (token.type === 'NUMBER') {
            this.eat('NUMBER');
            return { type: 'NumberLiteral', value: token.value };
        } else if (token.type === 'LPAREN') {
            this.eat('LPAREN');
            const node = this.expr();
            this.eat('RPAREN');
            return node;
        } else if (token.type === 'IDENTIFIER') {
            this.eat('IDENTIFIER');
            return { type: 'Variable', name: token.value };
        }
        throw new Error('Invalid factor');
    }

    term() {
        let node = this.factor();

        while (['MULTIPLY', 'DIVIDE'].includes(this.currentToken.type)) {
            const token = this.currentToken;
            if (token.type === 'MULTIPLY') {
                this.eat('MULTIPLY');
            } else if (token.type === 'DIVIDE') {
                this.eat('DIVIDE');
            }

            node = {
                type: 'BinaryOperation',
                operator: token.value,
                left: node,
                right: this.factor()
            };
        }

        return node;
    }

    expr() {
        let node = this.term();

        while (['PLUS', 'MINUS'].includes(this.currentToken.type)) {
            const token = this.currentToken;
            if (token.type === 'PLUS') {
                this.eat('PLUS');
            } else if (token.type === 'MINUS') {
                this.eat('MINUS');
            }

            node = {
                type: 'BinaryOperation',
                operator: token.value,
                left: node,
                right: this.term()
            };
        }

        return node;
    }

    assignment() {
        const name = this.currentToken.value;
        this.eat('IDENTIFIER');
        this.eat('ASSIGN');
        const value = this.expr();
        return { type: 'Assignment', name, value };
    }

    statement() {
        if (this.currentToken.type === 'IDENTIFIER' && this.lexer.input[this.lexer.position] === '=') {
            return this.assignment();
        }
        return this.expr();
    }

    program() {
        const statements = [];
        while (this.currentToken.type !== 'EOF') {
            statements.push(this.statement());
            if (this.currentToken.type === 'SEMICOLON') {
                this.eat('SEMICOLON');
            }
        }
        return { type: 'Program', body: statements };
    }

    parse() {
        return this.program();
    }
}

// Interpreter - Executes the AST
class Interpreter {
    constructor() {
        this.variables = new Map();
    }

    visitNumberLiteral(node) {
        return node.value;
    }

    visitBinaryOperation(node) {
        const left = this.evaluate(node.left);
        const right = this.evaluate(node.right);

        switch (node.operator) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return left / right;
            default: throw new Error(`Unknown operator: ${node.operator}`);
        }
    }

    visitVariable(node) {
        const value = this.variables.get(node.name);
        if (value === undefined) {
            throw new Error(`Variable ${node.name} is not defined`);
        }
        return value;
    }

    visitAssignment(node) {
        const value = this.evaluate(node.value);
        this.variables.set(node.name, value);
        return value;
    }

    visitProgram(node) {
        let result;
        for (const statement of node.body) {
            result = this.evaluate(statement);
        }
        return result;
    }

    evaluate(node) {
        switch (node.type) {
            case 'Program': return this.visitProgram(node);
            case 'NumberLiteral': return this.visitNumberLiteral(node);
            case 'BinaryOperation': return this.visitBinaryOperation(node);
            case 'Variable': return this.visitVariable(node);
            case 'Assignment': return this.visitAssignment(node);
            default: throw new Error(`Unknown node type: ${node.type}`);
        }
    }
}

// Example usage
function executeCode(sourceCode) {
    try {
        const lexer = new Lexer(sourceCode);
        const parser = new Parser(lexer);
        const interpreter = new Interpreter();
        
        const ast = parser.parse();
        const result = interpreter.evaluate(ast);
        
        return { success: true, result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Test the interpreter
const testCases = [
    'x = 5; y = 10; x + y * 2;',
    'a = 15 / 3; b = a * 2; b - 5;',
    'result = (10 + 5) * 2;'
];

testCases.forEach((code, index) => {
    console.log(`\nTest Case ${index + 1}:`);
    console.log('Code:', code);
    console.log('Result:', executeCode(code));
});


