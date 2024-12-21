// function checkNumber(number) {
//     if(number > 0){
//         console.log(`${number} is positive.`);
//     }
//     else if(number < 0 ){
//         console.log(`${number} is negative.`);
//     }
//     else{
//         console.log(`${number} is zero.`);

//     }
// }
// checkNumber("rishi");
// checkNumber("");
// checkNumber(10);
// checkNumber(-10);
// checkNumber(0);
// checkNumber(NaN);
// checkNumber(undefined);
// checkNumber(null);
// checkNumber(true);
// checkNumber(false);
// checkNumber(Infinity);
// checkNumber(-Infinity);



//Determine if a year is a leap year
// function isLeapYear(year){
//     if(year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)){
//         console.log(`${year} is a leap year.`);
//     }
//     else{
//         console.log(`${year} is not a leap year.`);
//     }
// }
// isLeapYear(2024);
// isLeapYear(2025);
// isLeapYear(2026);
// isLeapYear(2027);
// isLeapYear(2028);
// isLeapYear(2029);
// isLeapYear(2030);
// isLeapYear(2031);
// isLeapYear(2032);
// isLeapYear(2033);
// isLeapYear(2034);
// isLeapYear(2035);
// isLeapYear(2036);
// isLeapYear(2037);
// isLeapYear(2038);
// isLeapYear(2039);
// isLeapYear("rishi");
// // isLeapYear(rishi);

// Find the largest of three numbers

// function findLargestNumber(a, b, c){
//     let largest = (a > b) ? (a > c ? a : c) : (b > c ? b : c);
//     console.log(`largest number is ${largest}`);
    
// }

// findLargestNumber(10, 20, 30);
// findLargestNumber(10, 20, 10);
// findLargestNumber(10, 10, 10);
// findLargestNumber(10, 20, 10);
// findLargestNumber(10, 20, 30);


//Create a simple calculator using switch (add, subtract, multiply, divide).

// function calculator(a, b , operator){
//     switch(operator){
//         case '+':
//             console.log(`${a} + ${b} = ${a + b}`);
//             break;
//         case '-':
//             console.log(`${a} - ${b} = ${a - b}`);
//             break;
//         case '*':
//             console.log(`${a} * ${b} = ${a * b}`);
//             break;
//         case '/':
//             console.log(`${a} / ${b} = ${a / b}`);
//             break;
//             default:
//                 console.log(`Invalid operator`);
//     }
// }
// calculator(10, 20, '+');
// calculator(10, 20, '-');
// calculator(10, 20, '*');
// calculator(10, 20, '/');

