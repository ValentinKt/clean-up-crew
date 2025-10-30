import { useState, useCallback } from 'react';
import { Event, Location } from '../types';
import { generateEventDescription, suggestEquipment } from '../services/geminiService';

export interface FormData {
    title: string;
    description: string;
    location: Location | null;
    mapImageUrl: string;
    date: string;
    time: string;
    radius: number;
    equipmentList: string[];
}

export interface FormValidationState {
    isSubmitting: boolean;
    isGenerating: boolean;
    isLoadingSuggestions: boolean;
    suggestions: string[];
}

export interface UseFormValidationProps {
    initialData?: Partial<FormData>;
    existingEvent?: Event;
}

// Helper to format ISO date string to YYYY-MM-DD for date input
const toInputDate = (isoDate: string) => new Date(isoDate).toISOString().split('T')[0];

// Helper to format ISO date string to HH:mm for time input
const toInputTime = (isoDate: string) => {
    const date = new Date(isoDate);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

export const useFormValidation = ({ initialData, existingEvent }: UseFormValidationProps = {}) => {
    // Initialize form data
    const [formData, setFormData] = useState<FormData>({
        title: initialData?.title || existingEvent?.title || '',
        description: initialData?.description || existingEvent?.description || '',
        location: initialData?.location || existingEvent?.location || null,
        mapImageUrl: initialData?.mapImageUrl || existingEvent?.mapImageUrl || '',
        date: initialData?.date || (existingEvent ? toInputDate(existingEvent.date) : ''),
        time: initialData?.time || (existingEvent ? toInputTime(existingEvent.date) : ''),
        radius: initialData?.radius || existingEvent?.radius || 5,
        equipmentList: initialData?.equipmentList || 
            (existingEvent ? existingEvent.equipment.map(e => e.name).concat(['']) : [''])
    });

    // Form validation state
    const [validationState, setValidationState] = useState<FormValidationState>({
        isSubmitting: false,
        isGenerating: false,
        isLoadingSuggestions: false,
        suggestions: []
    });

    // Update individual form fields
    const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Equipment management functions
    const handleEquipmentChange = useCallback((index: number, value: string) => {
        setFormData(prev => {
            const newList = [...prev.equipmentList];
            newList[index] = value;
            return { ...prev, equipmentList: newList };
        });
    }, []);

    const addEquipmentField = useCallback(() => {
        setFormData(prev => ({ ...prev, equipmentList: [...prev.equipmentList, ''] }));
    }, []);

    const removeEquipmentField = useCallback((index: number) => {
        setFormData(prev => {
            if (prev.equipmentList.length > 1) {
                return { ...prev, equipmentList: prev.equipmentList.filter((_, i) => i !== index) };
            }
            return prev;
        });
    }, []);

    // AI-powered features
    const handleGenerateDescription = useCallback(async () => {
        if (!formData.title) {
            alert("Please enter a title first to generate a description.");
            return;
        }
        
        setValidationState(prev => ({ ...prev, isGenerating: true }));
        try {
            const aiDescription = await generateEventDescription(formData.title);
            setFormData(prev => ({ ...prev, description: aiDescription }));
        } catch (error) {
            console.error('Failed to generate description:', error);
            alert('Failed to generate description. Please try again.');
        } finally {
            setValidationState(prev => ({ ...prev, isGenerating: false }));
        }
    }, [formData.title]);

    const handleSuggestItems = useCallback(async () => {
        if (!formData.title && !formData.description) {
            alert("Please provide a title or description to get suggestions.");
            return;
        }
        
        setValidationState(prev => ({ 
            ...prev, 
            isLoadingSuggestions: true, 
            suggestions: [] 
        }));
        
        try {
            const newSuggestions = await suggestEquipment(formData.title, formData.description);
            const currentItemsLower = formData.equipmentList.map(i => i.toLowerCase());
            const filteredSuggestions = newSuggestions.filter(s => 
                !currentItemsLower.includes(s.toLowerCase())
            );
            
            setValidationState(prev => ({ 
                ...prev, 
                suggestions: filteredSuggestions 
            }));
        } catch (error) {
            console.error('Failed to get suggestions:', error);
            alert('Failed to get suggestions. Please try again.');
        } finally {
            setValidationState(prev => ({ ...prev, isLoadingSuggestions: false }));
        }
    }, [formData.title, formData.description, formData.equipmentList]);

    const addSuggestionToEquipment = useCallback((suggestion: string) => {
        setFormData(prev => {
            const emptyIndex = prev.equipmentList.findIndex(i => i === '');
            if (emptyIndex !== -1) {
                const newList = [...prev.equipmentList];
                newList[emptyIndex] = suggestion;
                return { ...prev, equipmentList: newList };
            } else {
                return { ...prev, equipmentList: [...prev.equipmentList, suggestion] };
            }
        });
        
        setValidationState(prev => ({
            ...prev,
            suggestions: prev.suggestions.filter(s => s !== suggestion)
        }));
    }, []);

    // Location handling
    const handleLocationChange = useCallback((newLocation: Location & { radius: number }, newMapImageUrl: string) => {
        updateField('location', newLocation);
        updateField('mapImageUrl', newMapImageUrl);
        updateField('radius', newLocation.radius / 1000); // Convert meters to kilometers for display
    }, [updateField]);

    // Form validation
    const validateForm = (): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!formData.title.trim()) {
            errors.push('Title is required');
        }

        if (!formData.description.trim()) {
            errors.push('Description is required');
        }

        if (!formData.location) {
            errors.push('Location is required');
        }

        if (!formData.date) {
            errors.push('Date is required');
        }

        if (!formData.time) {
            errors.push('Time is required');
        }

        // Validate date is not in the past
        if (formData.date && formData.time) {
            const eventDateTime = new Date(`${formData.date}T${formData.time}`);
            if (eventDateTime < new Date()) {
                errors.push('Event date and time must be in the future');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    };

    // Prepare form data for submission
    const prepareFormData = () => {
        const eventDateTime = new Date(`${formData.date}T${formData.time}`);
        
        return {
            title: formData.title,
            description: formData.description,
            location: formData.location!,
            mapImageUrl: formData.mapImageUrl,
            radius: formData.radius,
            date: eventDateTime.toISOString(),
            equipment: formData.equipmentList
                .filter(item => item.trim() !== '')
                .map((item, index) => {
                    // For existing events, try to preserve existing equipment IDs
                    if (existingEvent) {
                        const existingItem = existingEvent.equipment.find(e => e.name === item);
                        return existingItem || { id: `eq-${Date.now()}-${index}`, name: item };
                    }
                    return { id: `eq-${Date.now()}-${index}`, name: item };
                }),
        };
    };

    // Set submitting state
    const setSubmitting = (isSubmitting: boolean) => {
        setValidationState(prev => ({ ...prev, isSubmitting }));
    };

    return {
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
    };
};