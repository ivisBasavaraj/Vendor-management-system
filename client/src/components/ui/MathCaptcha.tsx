import React, { useState, useEffect } from 'react';

interface MathCaptchaProps {
  onVerify: (isVerified: boolean) => void;
}

const MathCaptcha: React.FC<MathCaptchaProps> = ({ onVerify }) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState('+');
  const [answer, setAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Generate a new math problem
  const generateProblem = () => {
    // Generate random numbers between 1 and 10
    const newNum1 = Math.floor(Math.random() * 10) + 1;
    const newNum2 = Math.floor(Math.random() * 10) + 1;
    
    // Choose a random operator (addition or subtraction)
    const operators = ['+', '-', '×'];
    const newOperator = operators[Math.floor(Math.random() * operators.length)];
    
    // For subtraction, ensure num1 >= num2 to avoid negative results
    if (newOperator === '-' && newNum1 < newNum2) {
      setNum1(newNum2);
      setNum2(newNum1);
    } else {
      setNum1(newNum1);
      setNum2(newNum2);
    }
    
    setOperator(newOperator);
    setAnswer('');
    setIsCorrect(null);
    setErrorMessage('');
  };

  // Calculate the correct answer
  const calculateCorrectAnswer = (): number => {
    switch (operator) {
      case '+':
        return num1 + num2;
      case '-':
        return num1 - num2;
      case '×':
        return num1 * num2;
      default:
        return 0;
    }
  };

  // Verify the user's answer
  const verifyAnswer = () => {
    if (!answer.trim()) {
      setErrorMessage('Please enter your answer');
      return;
    }

    const userAnswer = parseInt(answer, 10);
    const correctAnswer = calculateCorrectAnswer();
    
    const correct = userAnswer === correctAnswer;
    setIsCorrect(correct);
    onVerify(correct);
    
    if (!correct) {
      setErrorMessage(`Incorrect. The answer to ${num1} ${operator} ${num2} is ${correctAnswer}`);
      // Generate a new problem after a short delay
      setTimeout(generateProblem, 2000);
    }
  };

  // Generate a problem when the component mounts
  useEffect(() => {
    generateProblem();
  }, []);

  return (
    <div className="mt-6">
      <div className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Security Check
      </div>
      <div className="p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md">
        <div className="flex items-center justify-center mb-3">
          <span className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
            {num1} {operator} {num2} = ?
          </span>
        </div>
        
        <div className="flex space-x-2">
          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && verifyAnswer()}
            className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white sm:text-sm"
            placeholder="Enter answer"
          />
          <button
            onClick={verifyAnswer}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600"
          >
            Verify
          </button>
        </div>
        
        {errorMessage && (
          <div className="mt-2 text-sm text-danger-600 dark:text-danger-400">
            {errorMessage}
          </div>
        )}
        
        {isCorrect === true && (
          <div className="mt-2 text-sm text-success-600 dark:text-success-400">
            Correct! You may proceed.
          </div>
        )}
        
        <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 text-center">
          <button
            onClick={generateProblem}
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Try a different problem
          </button>
        </div>
      </div>
    </div>
  );
};

export default MathCaptcha;