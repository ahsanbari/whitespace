// Main application exports using MVVM architecture

// Models - Domain logic and business rules
export * from './models';

// Views - UI Components organized by feature  
export * from './views';

// ViewModels - State management and component logic
export * from './viewmodels';

// Services - External APIs and data fetching
export * from './services';

// Infrastructure - Foundation utilities, config, types
export * from './infrastructure';

// Re-export main components for convenience
export { LeafletMap } from './views/components/LeafletMap'; 