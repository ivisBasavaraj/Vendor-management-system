import React, { useState, useEffect } from 'react';

interface MathCaptchaProps {
  onValidationChange: (isValid: boolean) => void;
}

const MathCaptcha: React.FC<MathCaptchaProps> = ({ onValidationChange }) => {
  const [firstNumber, setFirstNumber] = useState(0);
  const [secondNumber, setSecondNumber] = useState(0);
  const [operation, setOperation] = useState<'+' | '-' | '*'>('*');
  const [userAnswer, setUserAnswer] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  // Generate a new math problem
  const generateMathProblem = () => {
    // Generate random numbers between 1 and 10
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    
    // Choose a random operation
    const operations: ('+' | '-' | '*')[] = ['+', '-', '*'];
    const randomOperation = operations[Math.floor(Math.random() * operations.length)];
    
    setFirstNumber(num1);
    setSecondNumber(num2);
    setOperation(randomOperation);
    setUserAnswer('');
    setIsValid(false);
    setError('');
  };

  // Calculate the correct answer
  const calculateCorrectAnswer = (): number => {
    switch (operation) {
      case '+':
        return firstNumber + secondNumber;
      case '-':
        return firstNumber - secondNumber;
      case '*':
        return firstNumber * secondNumber;
      default:
        return 0;
    }
  };

  // Validate the user's answer
  const validateAnswer = () => {
    const correctAnswer = calculateCorrectAnswer();
    const parsedUserAnswer = parseInt(userAnswer, 10);
    
    if (isNaN(parsedUserAnswer)) {
      setError('Please enter a valid number');
      setIsValid(false);
      onValidationChange(false);
      return;
    }
    
    if (parsedUserAnswer === correctAnswer) {
      setIsValid(true);
      setError('');
      onValidationChange(true);
    } else {
      setAttempts(attempts + 1);
      setError('Incorrect answer, please try again');
      setIsValid(false);
      onValidationChange(false);
      
      // Generate a new problem after 3 failed attempts
      if (attempts >= 2) {
        setAttempts(0);
        generateMathProblem();
      }
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(e.target.value);
    setIsValid(false);
    onValidationChange(false);
  };

  // Generate a math problem on component mount
  useEffect(() => {
    generateMathProblem();
  }, []);

  return (
    <div className="mt-3 mb-3">
      <label htmlFor="captcha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Security Check
      </label>
      <div className="mb-1 text-xs text-gray-600 dark:text-gray-400">
        Please solve this math problem to verify you're human:
      </div>
      
      <div className="flex items-center space-x-2 mb-1">
        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md font-medium text-sm">
          {firstNumber} {operation} {secondNumber} = ?
        </div>
        <input
          id="captcha"
          type="text"
          value={userAnswer}
          onChange={handleInputChange}
          onBlur={validateAnswer}
          className={`block w-20 px-2 py-1 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm ${
            error ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'
          } dark:bg-gray-800 dark:text-white`}
          placeholder="Answer"
        />
        <button
          type="button"
          onClick={generateMathProblem}
          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          title="Generate new problem"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {isValid && (
        <p className="mt-1 text-sm text-green-600 dark:text-green-400">Correct!</p>
      )}
    </div>
  );
};

export default MathCaptcha;