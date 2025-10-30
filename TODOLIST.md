# Todo List - Eco Cleanup Crew

## MapPicker Enhancement Tasks

[x] Examine current MapPicker component structure and dependencies
[x] Implement click event handling on map surface to capture coordinates
[x] Add visual marker/pin for selected location on map
[x] Update location input field to be disabled and auto-populate from map selection
[x] Ensure two-way binding and proper event emission for location changes
[x] Add mobile/touch device compatibility
[x] Handle edge cases and accessibility standards
[x] Test enhanced MapPicker functionality and commit changes
[x] Create unit tests for interactive map features

## Test Suite Development Tasks

[x] Create unit tests for CreateEventForm component
[x] Create unit tests for eventService functions
[x] Fix integration test mocking issues and simplify test structure
[x] Run integration tests to verify they pass
[x] Fix mockEventService references in edge-cases.test.tsx, error-handling.test.tsx, and form-validation.test.tsx
[ ] Debug and fix remaining test failures (some tests still failing due to complex mocking)
[ ] Run complete test suite and verify all tests pass
[x] Commit comprehensive test suite to version control

## Completed Features

✅ **Interactive Map Selection**: Users can now click anywhere on the map to set the event location
✅ **Visual Feedback**: Circle style changes temporarily when a location is selected
✅ **Coordinate Display**: Disabled input field shows user-friendly coordinates (latitude, longitude)
✅ **Mobile Compatibility**: Enhanced touch handling and responsive design
✅ **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
✅ **Error Handling**: Robust handling of invalid coordinates and network errors
✅ **Two-way Binding**: Proper state management and event emission
✅ **Simplified Integration Tests**: Service layer tests passing successfully
✅ **Fixed Test Mocking**: Replaced mockEventService with proper vi.mocked() patterns

## Working Tests

✅ **eventService.test.tsx**: 10 tests passing - service layer functionality
✅ **integration.test.tsx**: 6 tests passing - service integration tests
✅ **CreateEventForm.test.tsx**: 14 tests passing - component functionality

## Next Steps

[ ] Debug and fix remaining test failures in edge-cases.test.tsx and error-handling.test.tsx
[ ] Deploy database schema to Supabase (create_new_event function missing)
[ ] Consider adding location history/favorites functionality
[ ] Implement location validation against cleanup event requirements