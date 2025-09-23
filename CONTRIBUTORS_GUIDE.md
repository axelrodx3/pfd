# Contributors Guide - Hi-Lo Casino & Territory Wars

## 🎯 Project Overview

This repository contains a modern casino application with multiple games including:
- **Hi-Lo Dice Game** - The main casino game with Solana wallet integration
- **Territory Wars** - A turn-based tactical stick figure battle game
- **Modern Territory Wars** - Enhanced 3D version with modern UI (in development)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- Solana wallet (Phantom, Solflare, etc.) for testing
- Basic knowledge of React, TypeScript, and Phaser.js

### Setup
```bash
# Clone the repository
git clone https://github.com/axelrodx3/pfd.git
cd pfd

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🎮 Game Components

### Territory Wars Game
- **Location**: `src/pages/TerritoryWarsPage.tsx`
- **Modern Version**: `src/pages/ModernTerritoryWarsPage.tsx`
- **UI Components**: 
  - `src/components/ModernHUD.tsx`
  - `src/components/ModernWeaponSelector.tsx`
  - `src/components/ParticleEffects.tsx`

### Key Features Implemented
- ✅ Turn-based combat system
- ✅ Multiple weapon types (grenade, rifle, bazooka, boot)
- ✅ Unit classes (soldier, sniper, heavy, medic)
- ✅ Weather system affecting gameplay
- ✅ Power-up collection system
- ✅ Destructible terrain
- ✅ Comprehensive error reporting
- ✅ Modern UI components (work in progress)

## 🛠️ Recent Improvements

### Territory Wars Fixes (Latest Commit)
- Fixed stick figure stretching and rendering issues
- Resolved `unit.setFillStyle` and `setRotation` runtime errors
- Improved step counting and movement mechanics
- Enhanced error reporting system with centralized error handling
- Added game state validation and recovery mechanisms
- Cleaned up placeholder units to prevent runtime errors

### Error Handling System
- **Location**: `src/lib/errorReporting.ts`
- Centralized error reporting and monitoring
- Automatic error detection and recovery
- Comprehensive bug reporting system in the game UI

## 🎯 Areas for Contribution

### High Priority
1. **Modern Territory Wars UI**
   - Complete the 3D stick figure rendering
   - Implement smooth walking animations
   - Add particle effects for weapons
   - Polish the modern HUD design

2. **Game Balance & Features**
   - Fine-tune weapon damage and ranges
   - Add more unit abilities
   - Implement team selection system
   - Add more map types

3. **Performance Optimization**
   - Optimize Phaser.js rendering
   - Reduce memory usage
   - Improve frame rates

### Medium Priority
1. **UI/UX Improvements**
   - Add sound effects system
   - Implement better visual feedback
   - Add keyboard shortcuts
   - Improve mobile responsiveness

2. **Multiplayer Features**
   - Add online multiplayer support
   - Implement spectator mode
   - Add replay system

### Low Priority
1. **Documentation**
   - Add more comprehensive code comments
   - Create video tutorials
   - Add API documentation

## 🔧 Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow React best practices
- Use functional components with hooks
- Implement proper error boundaries
- Add JSDoc comments for complex functions

### Git Workflow
1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes and test thoroughly
3. Commit with descriptive messages: `git commit -m "Add: brief description"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Create a pull request with detailed description

### Testing
- Test in multiple browsers (Chrome, Firefox, Safari)
- Test with different Solana wallets
- Verify error handling works correctly
- Check performance on different devices

## 🐛 Bug Reports

### How to Report Issues
1. Use the in-game bug reporting system (🐛 Bugs button)
2. Create GitHub issues with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/device information
   - Screenshots if applicable

### Known Issues
- Territory Wars: Some visual artifacts during movement (being worked on)
- Mobile: Touch controls need improvement
- Performance: Occasional frame drops on older devices

## 🤝 Contributing Process

### For New Contributors
1. **Fork the repository**
2. **Set up your development environment**
3. **Pick an issue** from the "good first issue" label
4. **Make your changes** following the guidelines above
5. **Test thoroughly** before submitting
6. **Create a pull request** with a clear description

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested in Chrome
- [ ] Tested in Firefox
- [ ] Tested with Solana wallet
- [ ] No console errors

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] No hardcoded values
- [ ] Error handling implemented
```

## 📞 Communication

### Getting Help
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Pull Request Comments**: For code review feedback

### Response Times
- Bug reports: Within 24 hours
- Feature requests: Within 3 days
- Pull requests: Within 2 days

## 🎉 Recognition

Contributors will be recognized in:
- README.md contributors section
- Game credits (if applicable)
- Release notes for significant contributions

## 📋 Current Project Status

### ✅ Completed
- Basic Territory Wars game mechanics
- Error reporting and debugging system
- Modern UI component framework
- Game state management
- Weapon system implementation

### 🚧 In Progress
- Modern 3D Territory Wars UI
- Performance optimization
- Mobile responsiveness

### 📅 Planned
- Multiplayer support
- Advanced AI for CPU opponents
- Tournament system
- Custom map editor

---

**Thank you for contributing to this project!** 🚀

Your contributions help make this casino game more fun and engaging for players worldwide.
