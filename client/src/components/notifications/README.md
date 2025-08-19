# Pop-up Notification System

This notification system provides real-time pop-up notifications with sound effects for the Vendor Management System.

## Features

### 🔔 Pop-up Notifications
- **Real-time notifications** that appear as overlay pop-ups
- **Multiple positioning options**: top-right, top-left, bottom-right, bottom-left
- **Auto-close functionality** with customizable duration (2-10 seconds)
- **Priority-based styling** with color-coded borders
- **Stacking support** for multiple notifications
- **Smooth animations** for show/hide transitions

### 🔊 Sound Effects
- **Type-specific sounds** for different notification types:
  - **Success**: Pleasant ascending tones (C5 → E5 → G5)
  - **Error**: Warning descending tones
  - **Warning**: Attention-grabbing pattern
  - **Info**: Clean and simple tones
  - **Default**: Gentle notification sound
- **Web Audio API** for programmatic sound generation
- **Audio file support** with fallback to generated sounds
- **Volume control** and enable/disable options

### ⚙️ Customizable Settings
- **Enable/disable** pop-up notifications
- **Position selection** for notification placement
- **Auto-close toggle** and duration control
- **Sound effects** enable/disable
- **Maximum notifications** limit (1-10)
- **Important only mode** (high/urgent priority only)
- **Settings persistence** in localStorage

### 🎨 Visual Design
- **Type-specific icons** and colors
- **Priority indicators** with colored borders
- **Sender information** display
- **Related document** information
- **Action buttons** for interaction
- **Progress bar** for auto-close countdown

## Usage

### Basic Implementation

```tsx
import { useNotificationPopup } from '../../contexts/NotificationPopupContext';

const MyComponent = () => {
  const { showNotification } = useNotificationPopup();

  const handleShowNotification = () => {
    showNotification({
      title: 'Document Approved',
      message: 'Your compliance document has been approved.',
      type: 'document_approved',
      priority: 'high',
      createdAt: new Date().toISOString(),
      sender: {
        name: 'John Consultant',
        email: 'john@example.com'
      },
      actionUrl: '/documents/123'
    });
  };

  return (
    <button onClick={handleShowNotification}>
      Show Notification
    </button>
  );
};
```

### Settings Component

```tsx
import NotificationSettings from './NotificationSettings';

const MyPage = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <button onClick={() => setShowSettings(true)}>
        Settings
      </button>
      
      <NotificationSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
};
```

## Notification Types

| Type | Description | Sound | Color |
|------|-------------|-------|-------|
| `document_approved` | Document approval | Success | Green |
| `document_rejected` | Document rejection | Error | Red |
| `document_submission` | New document submitted | Info | Blue |
| `document_review` | Document under review | Warning | Yellow |
| `user_registration` | New user registered | Info | Purple |
| `login_request` | Login approval needed | Info | Purple |
| `login_approved` | Login approved | Success | Green |
| `login_rejected` | Login rejected | Error | Red |
| `workflow_update` | Workflow status change | Info | Indigo |
| `system` | System notifications | Warning | Gray |

## Priority Levels

| Priority | Border Color | Behavior |
|----------|-------------|----------|
| `urgent` | Red | Never auto-close, requires interaction |
| `high` | Orange | Extended display time |
| `medium` | Yellow | Standard display time |
| `low` | Green | Quick auto-close |

## WebSocket Integration

The system automatically listens for WebSocket messages and displays notifications:

```javascript
// WebSocket message format
{
  type: 'notification',
  data: {
    title: 'New Document',
    message: 'A new document has been submitted.',
    type: 'document_submission',
    priority: 'medium',
    sender: { name: 'Vendor Name', email: 'vendor@example.com' },
    relatedDocument: { title: 'Compliance Report', status: 'pending' }
  }
}
```

## Browser Notifications

The system also supports native browser notifications:
- Requests permission on first load
- Shows browser notification alongside pop-up
- Respects user's browser notification settings
- Auto-closes after 5 seconds (except urgent notifications)

## Testing

Use the built-in test functions:

```tsx
// Test single notification
const { showNotification } = useNotificationPopup();
showNotification({
  title: 'Test',
  message: 'This is a test notification',
  type: 'system',
  priority: 'medium',
  createdAt: new Date().toISOString()
});

// Test all sound types
import soundService from '../../utils/soundService';
soundService.testAllSounds();
```

## Configuration

Settings are automatically saved to localStorage:

```javascript
{
  enabled: true,
  position: 'top-right',
  autoClose: true,
  duration: 5000,
  soundEnabled: true,
  maxNotifications: 5,
  showOnlyImportant: false
}
```

## Accessibility

- **Keyboard navigation** support
- **Screen reader** compatible
- **High contrast** mode support
- **Reduced motion** respect
- **Focus management** for modal dialogs

## Performance

- **Lazy loading** of sound files
- **Memory efficient** notification stacking
- **Automatic cleanup** of old notifications
- **Optimized animations** with CSS transforms
- **Debounced** WebSocket message handling