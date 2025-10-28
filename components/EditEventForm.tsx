import React, { useEffect } from 'react';
import { Event, Location, User } from '../types';
import { updateEvent } from '../services/eventService';
import MapPicker from './MapPicker';
import { useNotifications } from '../hooks/useNotifications';
import { useFormValidation } from '../hooks/useFormValidation';

interface EditEventFormProps {
    eventToEdit: Event;
    onEventUpdated: (event: Event) => void;
    onCancel: () => void;
}

// Helper to format ISO date string to YYYY-MM-DD for date input
const toInputDate = (isoDate: string) => new Date(isoDate).toISOString().split('T')[0];

// Helper to format ISO date string to HH:mm for time input
const toInputTime = (isoDate: string) => {
    const date = new Date(isoDate);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

const EditEventForm: React.FC<EditEventFormProps> = ({ eventToEdit, onEventUpdated, onCancel }) => {
    const { addNotification } = useNotifications();
    
    // Initialize form with event data
    const initialFormData = {
        title: eventToEdit.title,
        description: eventToEdit.description,
        location: eventToEdit.location,
        mapImageUrl: eventToEdit.mapImageUrl,
        date: toInputDate(eventToEdit.date),
        time: toInputTime(eventToEdit.date),
        radius: eventToEdit.radius,
        equipmentList: eventToEdit.equipment.map(e => e.name).concat([''])
    };

    const {
        formData,
        validationState,
        updateField,
        handleEquipmentChange,
        addEquipmentField,
        removeEquipmentField,
        handleGenerateDescription,
        handleSuggestItems,
        addSuggestionToEquipment,
        handleLocationChange,
        validateForm,
        prepareFormData,
        setSubmitting
    } = useFormValidation({ existingEvent: eventToEdit });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            addNotification('error', 'Validation Error', 'Please check all required fields.');
            return;
        }

        setSubmitting(true);
        
        try {
            const eventData = prepareFormData();
            const updatedEvent = await updateEvent(eventToEdit.id, eventData);
            
            if (updatedEvent) {
                addNotification('success', 'Event Updated', `"${updatedEvent.title}" has been updated successfully!`);
                onEventUpdated(updatedEvent);
            }
        } catch (error) {
            console.error('Error updating event:', error);
            addNotification('error', 'Update Failed', 'Failed to update event. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Event</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Event Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                Event Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                value={formData.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="Enter event title"
                                required
                            />
                        </div>

                        {/* Event Description */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Event Description *
                                </label>
                                <button
                                    type="button"
                                    onClick={handleGenerateDescription}
                                    disabled={validationState.isGenerating || !formData.title || !formData.location}
                                    className="px-3 py-1 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {validationState.isGenerating ? 'Generating...' : '✨ AI Generate'}
                                </button>
                            </div>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => updateField('description', e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="Describe your cleanup event..."
                                required
                            />
                        </div>

                        {/* Date and Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    id="date"
                                    value={formData.date}
                                    onChange={(e) => updateField('date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                                    Time *
                                </label>
                                <input
                                    type="time"
                                    id="time"
                                    value={formData.time}
                                    onChange={(e) => updateField('time', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Location *
                            </label>
                            <MapPicker
                    initialLocation={formData.location ? { ...formData.location, radius: formData.radius } : undefined}
                    onLocationChange={handleLocationChange}
                />
                        </div>

                        {/* Cleanup Radius */}
                        <div>
                            <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
                                Cleanup Radius: {formData.radius}m
                            </label>
                            <input
                                type="range"
                                id="radius"
                                min="50"
                                max="500"
                                step="50"
                                value={formData.radius}
                                onChange={(e) => updateField('radius', parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>50m</span>
                                <span>500m</span>
                            </div>
                        </div>

                        {/* Equipment List */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Equipment Needed
                                </label>
                                <div className="flex gap-2">
                                    <button
                                    type="button"
                                    onClick={handleSuggestItems}
                                    disabled={validationState.isLoadingSuggestions || !formData.location}
                                    className="px-3 py-1 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {validationState.isLoadingSuggestions ? 'Loading...' : '🤖 AI Suggest'}
                                </button>
                                    <button
                                        type="button"
                                        onClick={addEquipmentField}
                                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                                    >
                                        + Add Item
                                    </button>
                                </div>
                            </div>
                            
                            {formData.equipmentList.map((item, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleEquipmentChange(index, e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="Equipment item..."
                                    />
                                    {formData.equipmentList.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeEquipmentField(index)}
                                            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}

                            {/* Equipment Suggestions */}
                            {validationState.suggestions.length > 0 && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Suggested Equipment:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {validationState.suggestions.map((suggestion, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => addSuggestionToEquipment(suggestion)}
                                                className="px-2 py-1 text-sm bg-teal-100 text-teal-800 rounded-md hover:bg-teal-200"
                                            >
                                                + {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-4 pt-6">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={validationState.isSubmitting}
                                className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {validationState.isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditEventForm;