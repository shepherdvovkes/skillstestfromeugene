# Wallet Connection Enhancement - Test Guide

## Quick Test Checklist

### 1. Error Handling Tests
- [ ] **MetaMask Error**: Disable MetaMask extension and try to connect
- [ ] **TokenPocket Error**: Test with TokenPocket not installed
- [ ] **Bitget Wallet Error**: Test with Bitget Wallet not available
- [ ] **Particle Network Error**: Test network connectivity issues
- [ ] **WalletConnect Error**: Test with WalletConnect unavailable
- [ ] **Retry Mechanism**: Verify 3 retry attempts with 1-second delays
- [ ] **Error Messages**: Confirm specific error messages for each wallet type

### 2. Loading States Tests
- [ ] **Connection Progress**: Check progress bar during connection
- [ ] **Button States**: Verify buttons are disabled during connection
- [ ] **Retry Counter**: Test retry attempt display (1/3, 2/3, 3/3)
- [ ] **Loading Text**: Confirm "Connecting..." and "Retrying..." states
- [ ] **Progress Reset**: Verify progress resets after connection/disconnection

### 3. Network Validation Tests
- [ ] **Polygon Network**: Connect to Polygon (Chain ID: 137)
- [ ] **Linea Network**: Connect to Linea (Chain ID: 59144)
- [ ] **BSC Network**: Connect to BSC (Chain ID: 56)
- [ ] **Network Switching**: Test switching between supported networks
- [ ] **Unsupported Network**: Connect to unsupported network (e.g., Ethereum mainnet)
- [ ] **Network Warnings**: Verify warnings for unsupported networks
- [ ] **Quick Switch**: Test quick network switching buttons

### 4. Connection Persistence Tests
- [ ] **Page Refresh**: Connect wallet, refresh page, verify auto-reconnect
- [ ] **Last Wallet Memory**: Disconnect and reconnect, verify last wallet remembered
- [ ] **User Preferences**: Test auto-reconnect toggle functionality
- [ ] **Connection State**: Verify connection state persists in localStorage
- [ ] **Auto-reconnect**: Test auto-reconnect on page load

## Manual Test Scenarios

### Scenario 1: First-time Connection
1. Open application
2. Click "Connect Wallet"
3. Select MetaMask
4. Approve connection in MetaMask
5. Verify success message and connection status
6. Check localStorage for saved connection state

### Scenario 2: Error Handling
1. Disable MetaMask extension
2. Try to connect to MetaMask
3. Verify error message: "Please install MetaMask extension or check if it's unlocked"
4. Check retry mechanism (3 attempts)
5. Verify retry counter display

### Scenario 3: Network Switching
1. Connect wallet to Polygon
2. Switch to Linea network
3. Verify success message: "Switched to Linea network"
4. Check network status indicator
5. Test quick network switching buttons

### Scenario 4: Connection Persistence
1. Connect wallet
2. Refresh page
3. Verify auto-reconnect functionality
4. Check connection state in localStorage
5. Test user preferences persistence

### Scenario 5: Unsupported Network
1. Connect to unsupported network (e.g., Ethereum mainnet)
2. Verify warning message
3. Test network switching suggestions
4. Switch to supported network
5. Verify warning disappears

## Expected Behaviors

### Error Messages
- **MetaMask**: "Please install MetaMask extension or check if it's unlocked"
- **TokenPocket**: "Please install TokenPocket or check if it's unlocked"
- **Bitget Wallet**: "Please install Bitget Wallet or check if it's unlocked"
- **Particle Network**: "Particle Network connection failed. Please try again."
- **WalletConnect**: "WalletConnect connection failed. Please try again."

### Loading States
- Connection progress bar: 0% → 90% during connection
- Button text: "Connect MetaMask" → "Connecting..." → "Retrying... (1/3)"
- Disabled buttons during connection attempts
- Progress reset after connection/disconnection

### Network Status
- ✅ Supported networks: Green indicator
- ❌ Unsupported networks: Red indicator
- Network switching: Success/error messages
- Quick switch buttons for supported networks

### Persistence
- Auto-reconnect on page refresh
- Last connected wallet remembered
- User preferences saved in localStorage
- Connection state persists across sessions

## Browser Console Checks

### localStorage Items
```javascript
// Check saved connection state
localStorage.getItem('lastConnectedWallet')
localStorage.getItem('walletConnectionState')
localStorage.getItem('userWalletPreferences')
```

### Error Logging
```javascript
// Check for error logs
console.log('Wallet connection error logs should appear here')
```

### Network Validation
```javascript
// Check network status
console.log('Network validation logs should appear here')
```

## Performance Checks

- [ ] Connection attempts complete within reasonable time
- [ ] No memory leaks during retry attempts
- [ ] localStorage operations don't block UI
- [ ] Smooth transitions between states
- [ ] No excessive re-renders

## Accessibility Checks

- [ ] Loading states are announced to screen readers
- [ ] Error messages are accessible
- [ ] Button states are properly indicated
- [ ] Network status is conveyed to assistive technologies
- [ ] Keyboard navigation works properly

## Mobile Testing

- [ ] Test on mobile browsers
- [ ] Verify wallet app integration
- [ ] Check responsive design
- [ ] Test touch interactions
- [ ] Verify mobile wallet connections

## Cross-browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

## Success Criteria

All tests should pass with:
- ✅ Proper error handling and user feedback
- ✅ Smooth loading states and progress indicators
- ✅ Accurate network validation and switching
- ✅ Reliable connection persistence
- ✅ No breaking changes to existing functionality
- ✅ Professional UI without emojis
- ✅ Clean, accessible design
