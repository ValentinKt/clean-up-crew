import React, { useEffect } from 'react';
import { User, Event, Location } from '../types';
import { createEvent } from '../services/eventService';
import MapPicker from './MapPicker';
import { useNotifications } from '../hooks/useNotifications';
import { useFormValidation } from '../hooks/useFormValidation';

interface CreateEventFormProps {
    currentUser: User;
    onEventCreated: (event: Event) => void;
    onCancel: () => void;
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({ currentUser, onEventCreated, onCancel }) => {
    const { addNotification } = useNotifications();
    
    // Use the form validation hook
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
    } = useFormValidation();

    // Load draft from localStorage on component mount
    useEffect(() => {
        const savedDraft = localStorage.getItem('eventDraft');
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                updateField('title', draft.title || '');
                updateField('description', draft.description || '');
                updateField('date', draft.date || '');
                updateField('time', draft.time || '');
                updateField('radius', draft.radius || 5);
                updateField('equipmentList', draft.equipmentList || ['']);
            } catch (error) {
                console.error('Failed to load draft:', error);
            }
        }
    }, [updateField]);

    // Save draft to localStorage whenever form data changes
    useEffect(() => {
        const draft = {
            title: formData.title,
            description: formData.description,
            date: formData.date,
            time: formData.time,
            radius: formData.radius,
            equipmentList: formData.equipmentList,
        };
        localStorage.setItem('eventDraft', JSON.stringify(draft));
    }, [formData.title, formData.description, formData.date, formData.time, formData.radius, formData.equipmentList]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const validation = validateForm();
        if (!validation.isValid) {
            addNotification('error', 'Validation Error', validation.errors.join(', '));
            return;
        }

        setSubmitting(true);
        
        try {
            const eventData = prepareFormData();
            const newEvent = await createEvent(eventData, currentUser);
            
            if (newEvent) {
                localStorage.removeItem('eventDraft');
                addNotification('success', 'Event Created', `"${newEvent.title}" has been created successfully!`);
                onEventCreated(newEvent);
            }
        } catch (error) {
            console.error("Failed to create event:", error);
            addNotification('error', 'Creation Failed', 'There was a problem creating your event. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Create a New Cleanup Event</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Event Title</label>
                    <input 
                        type="text" 
                        id="title" 
                        value={formData.title} 
                        onChange={e => updateField('title', e.target.value)} 
                        required 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                </div>
                
                <div>
                    <div className="flex justify-between items-center">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <button 
                            type="button" 
                            onClick={handleGenerateDescription} 
                            disabled={validationState.isGenerating} 
                            className="text-sm font-semibold text-teal-600 hover:text-teal-800 disabled:opacity-50 disabled:cursor-wait flex items-center"
                        >
                            <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {validationState.isGenerating ? 'Generating...' : 'Generate with AI'}
                        </button>
                    </div>
                    <textarea 
                        id="description" 
                        value={formData.description} 
                        onChange={e => updateField('description', e.target.value)} 
                        required 
                        rows={4} 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                        <input 
                            type="date" 
                            id="date" 
                            value={formData.date} 
                            min={new Date().toISOString().split("T")[0]} 
                            onChange={e => updateField('date', e.target.value)} 
                            required 
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="time" className="block text-sm font-medium text-gray-700">Time</label>
                        <input 
                            type="time" 
                            id="time" 
                            value={formData.time} 
                            onChange={e => updateField('time', e.target.value)} 
                            required 
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <MapPicker onLocationChange={handleLocationChange} />
                </div>

                <div>
                    <label htmlFor="radius" className="block text-sm font-medium text-gray-700">
                        Cleanup Radius: <span className="font-bold text-teal-600">{formData.radius} km</span>
                    </label>
                    <input 
                        type="range" 
                        id="radius" 
                        min="1" 
                        max="10" 
                        value={formData.radius} 
                        onChange={e => updateField('radius', Number(e.target.value))} 
                        className="mt-1 block w-full accent-teal-600"
                    />
                </div>

                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Equipment to Bring</h3>
                    <div className="space-y-2">
                        {formData.equipmentList.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    value={item} 
                                    onChange={e => handleEquipmentChange(index, e.target.value)} 
                                    placeholder="e.g., Gloves, Trash bags" 
                                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => removeEquipmentField(index)} 
                                    className="p-2 text-red-500 hover:bg-red-100 rounded-full disabled:opacity-50" 
                                    disabled={formData.equipmentList.length <= 1}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button 
                        type="button" 
                        onClick={addEquipmentField} 
                        className="mt-2 text-sm font-semibold text-teal-600 hover:text-teal-800"
                    >
                        + Add another item
                    </button>
                    
                    <div className="mt-4 p-3 bg-teal-50/50 rounded-lg">
                        <button 
                            type="button" 
                            onClick={handleSuggestItems} 
                            disabled={validationState.isLoadingSuggestions} 
                            className="text-sm font-semibold text-teal-600 hover:text-teal-800 disabled:opacity-50 disabled:cursor-wait flex items-center"
                        >
                            <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {validationState.isLoadingSuggestions ? 'Thinking...' : 'Suggest Items with AI'}
                        </button>
                        {validationState.suggestions.length > 0 && (
                            <div className="mt-2">
                                <p className="text-xs font-semibold text-gray-600 mb-2">Click to add a suggestion:</p>
                                <div className="flex flex-wrap gap-2">
                                    {validationState.suggestions.map((s, i) => (
                                        <button 
                                            type="button" 
                                            key={i} 
                                            onClick={() => addSuggestionToEquipment(s)} 
                                            className="px-3 py-1 bg-teal-100 text-teal-800 text-sm rounded-full hover:bg-teal-200 transition-colors"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={validationState.isSubmitting} 
                        className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                    >
                        {validationState.isSubmitting ? 'Creating Event...' : 'Create Event'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateEventForm;