import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Modal, Paper, Button, IconButton } from '@mui/material';
import { format, getDaysInMonth, isValid, parse } from 'date-fns';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloseIcon from '@mui/icons-material/Close';

interface ScrollingDatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  minYear?: number;
  maxYear?: number;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  error?: boolean;
  helperText?: string;
  id?: string;
  name?: string;
}

interface ColumnProps {
  items: Array<{ value: number; display: string }>;
  selectedIndex: number;
  onChange: (index: number) => void;
  label: string;
}

const ITEM_HEIGHT = 40; // Height of each item in the column
const VISIBLE_ITEMS = 5; // Number of visible items in the column
const MOMENTUM_FACTOR = 0.8; // Factor for scroll momentum

const Column: React.FC<ColumnProps> = ({ items, selectedIndex, onChange, label }) => {
  const columnRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(selectedIndex * ITEM_HEIGHT);
  const [velocity, setVelocity] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [lastTime, setLastTime] = useState(0);
  
  // Calculate total height of the column
  const totalHeight = items.length * ITEM_HEIGHT;
  // Calculate the maximum scroll position
  const maxScroll = Math.max(0, totalHeight - VISIBLE_ITEMS * ITEM_HEIGHT);

  // Initialize scroll position based on selected index
  useEffect(() => {
    if (!isDragging) {
      setScrollTop(selectedIndex * ITEM_HEIGHT);
    }
  }, [selectedIndex, isDragging]);

  // Handle mouse/touch down
  const handleStart = (clientY: number) => {
    setIsDragging(true);
    setStartY(clientY);
    setLastY(clientY);
    setLastTime(Date.now());
    setVelocity(0);
  };

  // Handle mouse/touch move
  const handleMove = (clientY: number) => {
    if (!isDragging) return;
    
    const delta = clientY - startY;
    const newScrollTop = Math.max(0, Math.min(maxScroll, scrollTop - delta));
    
    setScrollTop(newScrollTop);
    setStartY(clientY);
    
    // Calculate velocity for momentum
    const now = Date.now();
    const elapsed = now - lastTime;
    if (elapsed > 0) {
      const v = (lastY - clientY) / elapsed;
      setVelocity(v * 1000); // Scale to pixels per second
    }
    setLastY(clientY);
    setLastTime(now);
  };

  // Handle mouse/touch up - apply momentum and snap to closest item
  const handleEnd = () => {
    setIsDragging(false);
    
    // Apply momentum with decay
    let currentVelocity = velocity;
    let currentScrollTop = scrollTop;
    
    const applyMomentum = () => {
      if (Math.abs(currentVelocity) < 1) {
        // When velocity is small enough, snap to closest item
        const index = Math.round(currentScrollTop / ITEM_HEIGHT);
        const targetScrollTop = index * ITEM_HEIGHT;
        
        // Animate to the target position
        const animate = () => {
          const diff = targetScrollTop - currentScrollTop;
          if (Math.abs(diff) < 1) {
            currentScrollTop = targetScrollTop;
            setScrollTop(currentScrollTop);
            onChange(Math.min(items.length - 1, index));
            return;
          }
          
          currentScrollTop += diff * 0.2;
          setScrollTop(currentScrollTop);
          requestAnimationFrame(animate);
        };
        
        animate();
        return;
      }
      
      // Apply velocity with decay
      currentScrollTop += currentVelocity * 0.016; // Assuming 60fps (1/60 ≈ 0.016)
      currentScrollTop = Math.max(0, Math.min(maxScroll, currentScrollTop));
      currentVelocity *= MOMENTUM_FACTOR; // Decay
      
      setScrollTop(currentScrollTop);
      requestAnimationFrame(applyMomentum);
    };
    
    requestAnimationFrame(applyMomentum);
  };

  // Handle direct click on an item
  const handleItemClick = (index: number) => {
    setIsDragging(false);
    setVelocity(0);
    setScrollTop(index * ITEM_HEIGHT);
    onChange(index);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '33.33%',
        overflow: 'hidden',
        position: 'relative',
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
        '&::before, &::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          height: ITEM_HEIGHT * 2,
          pointerEvents: 'none',
          zIndex: 1,
        },
        '&::before': {
          top: 0,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 100%)',
        },
        '&::after': {
          bottom: 0,
          background: 'linear-gradient(to top, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 100%)',
        }
      }}
    >
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          top: 4,
          color: 'text.secondary',
          zIndex: 2,
        }}
      >
        {label}
      </Typography>
      
      {/* Highlight overlay for selected item */}
      <Box
        sx={{
          position: 'absolute',
          left: '10%',
          right: '10%',
          top: '50%',
          height: ITEM_HEIGHT,
          transform: 'translateY(-50%)',
          backgroundColor: 'primary.main',
          opacity: 0.1,
          borderRadius: 1,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      
      <Box
        ref={columnRef}
        sx={{
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
        onMouseDown={(e) => handleStart(e.clientY)}
        onMouseMove={(e) => handleMove(e.clientY)}
        onMouseUp={() => handleEnd()}
        onMouseLeave={() => isDragging && handleEnd()}
        onTouchStart={(e) => handleStart(e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientY)}
        onTouchEnd={() => handleEnd()}
      >
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            transform: `translateY(${ITEM_HEIGHT * 2 - scrollTop}px)`,
          }}
        >
          {items.map((item, index) => (
            <Box
              key={index}
              onClick={() => handleItemClick(index)}
              sx={{
                height: ITEM_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: index === Math.round(scrollTop / ITEM_HEIGHT) ? 'primary.main' : 'text.primary',
                fontWeight: index === Math.round(scrollTop / ITEM_HEIGHT) ? 'bold' : 'normal',
                transition: 'color 0.2s, font-weight 0.2s',
              }}
            >
              <Typography variant="body1">
                {item.display}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

const DatePickerContent: React.FC<{
  value: Date;
  onChange: (date: Date) => void;
  minYear?: number;
  maxYear?: number;
  onClose: () => void;
}> = ({
  value,
  onChange,
  minYear = 1900,
  maxYear = new Date().getFullYear() + 10,
  onClose
}) => {
  // Initialize with the provided date
  const [selectedDay, setSelectedDay] = useState(value.getDate());
  const [selectedMonth, setSelectedMonth] = useState(value.getMonth());
  const [selectedYear, setSelectedYear] = useState(value.getFullYear());
  
  // Generate days based on selected month and year
  const getDaysArray = () => {
    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth));
    return Array.from({ length: daysInMonth }, (_, i) => ({
      value: i + 1,
      display: String(i + 1)
    }));
  };
  
  // Generate months
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    display: format(new Date(2000, i, 1), 'MMM')
  }));
  
  // Generate years
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => ({
    value: minYear + i,
    display: String(minYear + i)
  }));
  
  // Days array that updates when month or year changes
  const [days, setDays] = useState(getDaysArray());
  
  // Update days when month or year changes
  useEffect(() => {
    setDays(getDaysArray());
    
    // Adjust selected day if it exceeds the number of days in the month
    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth));
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedMonth, selectedYear]);
  
  // Update the date when selections change
  useEffect(() => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    onChange(newDate);
  }, [selectedDay, selectedMonth, selectedYear, onChange]);
  
  // Find indices for the current selections
  const dayIndex = days.findIndex(d => d.value === selectedDay);
  const monthIndex = months.findIndex(m => m.value === selectedMonth);
  const yearIndex = years.findIndex(y => y.value === selectedYear);

  const handleConfirm = () => {
    onClose();
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        width: '100%',
        maxWidth: 360,
        margin: '0 auto',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          Select Date
        </Typography>
        <Typography variant="subtitle1" color="primary.main">
          {format(new Date(selectedYear, selectedMonth, selectedDay), 'dd MMM yyyy')}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <Box
        sx={{
          display: 'flex',
          height: ITEM_HEIGHT * VISIBLE_ITEMS,
          backgroundColor: 'background.paper',
          position: 'relative',
        }}
      >
        <Column
          items={days}
          selectedIndex={dayIndex !== -1 ? dayIndex : 0}
          onChange={(index) => setSelectedDay(days[index].value)}
          label="Day"
        />
        
        <Column
          items={months}
          selectedIndex={monthIndex}
          onChange={(index) => setSelectedMonth(months[index].value)}
          label="Month"
        />
        
        <Column
          items={years}
          selectedIndex={yearIndex !== -1 ? yearIndex : 0}
          onChange={(index) => setSelectedYear(years[index].value)}
          label="Year"
        />
      </Box>
      
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleConfirm}
        >
          Confirm
        </Button>
      </Box>
    </Paper>
  );
};

const ScrollingDatePicker: React.FC<ScrollingDatePickerProps> = ({
  value,
  onChange,
  minYear = 1900,
  maxYear = new Date().getFullYear() + 10,
  label = 'Date',
  placeholder = 'Select date',
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  error = false,
  helperText = '',
  id,
  name,
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  // Format for display and parsing
  const dateFormat = 'dd/MM/yyyy';
  
  // Update input value when value prop changes
  useEffect(() => {
    if (value && isValid(value)) {
      setInputValue(format(value, dateFormat));
    } else {
      setInputValue('');
    }
  }, [value, dateFormat]);
  
  const handleDateChange = (date: Date) => {
    onChange(date);
    setInputValue(format(date, dateFormat));
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Try to parse the input value as a date
    try {
      const parsedDate = parse(newValue, dateFormat, new Date());
      if (isValid(parsedDate)) {
        onChange(parsedDate);
      }
    } catch (error) {
      // Invalid date format, don't update the date
    }
  };
  
  const handleInputBlur = () => {
    // If input is empty, set value to null
    if (!inputValue.trim()) {
      onChange(null);
      return;
    }
    
    // Try to parse the input value as a date
    try {
      const parsedDate = parse(inputValue, dateFormat, new Date());
      if (isValid(parsedDate)) {
        onChange(parsedDate);
        setInputValue(format(parsedDate, dateFormat));
      } else {
        // If invalid, revert to the previous valid value
        if (value && isValid(value)) {
          setInputValue(format(value, dateFormat));
        } else {
          setInputValue('');
        }
      }
    } catch (error) {
      // If parsing fails, revert to the previous valid value
      if (value && isValid(value)) {
        setInputValue(format(value, dateFormat));
      } else {
        setInputValue('');
      }
    }
  };
  
  const handleOpen = () => {
    if (!disabled) {
      setOpen(true);
    }
  };
  
  const handleClose = () => {
    setOpen(false);
  };
  
  return (
    <div className={className}>
      <div className="relative">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <input
            type="text"
            id={id}
            name={name}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClassName}`}
            required={required}
          />
          <button
            type="button"
            onClick={handleOpen}
            disabled={disabled}
            className="absolute inset-y-0 right-0 px-3 flex items-center"
          >
            <CalendarTodayIcon fontSize="small" />
          </button>
        </div>
        {helperText && (
          <p className={`mt-1 text-sm ${error ? 'text-red-500' : 'text-gray-500'}`}>
            {helperText}
          </p>
        )}
      </div>
      
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="date-picker-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <DatePickerContent
          value={value || new Date()}
          onChange={handleDateChange}
          minYear={minYear}
          maxYear={maxYear}
          onClose={handleClose}
        />
      </Modal>
    </div>
  );
};

export default ScrollingDatePicker;