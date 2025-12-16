import { useState, useCallback } from "react"
import { validateField, ValidationRule, ValidationResult } from '@/shared/lib/validation'

interface FormField<T = any> {
  value: T
  rules: ValidationRule<T>
  error?: string
}

interface UseFormValidationOptions<T extends Record<string, any>> {
  initialValues: T
  validationRules: { [K in keyof T]: ValidationRule<T[K]> }
  onSubmit?: (values: T) => void | Promise<void>
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validationRules,
  onSubmit,
}: UseFormValidationOptions<T>) {
  const [fields, setFields] = useState<Record<keyof T, FormField<T[keyof T]>>>(() => {
    const initialFields = {} as Record<keyof T, FormField<T[keyof T]>>
    for (const key in initialValues) {
      initialFields[key] = {
        value: initialValues[key],
        rules: validationRules[key],
      }
    }
    return initialFields
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = useCallback((name: keyof T): ValidationResult => {
    const field = fields[name]
    if (!field) return { isValid: true }
    
    const result = validateField(field.value, field.rules)
    
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        error: result.error,
      },
    }))

    return result
  }, [fields])

  const validateAll = useCallback((): boolean => {
    let isValid = true
    
    for (const key in fields) {
      const result = validateField(key as keyof T)
      if (!result.isValid) {
        isValid = false
      }
    }
    
    return isValid
  }, [fields, validateField])

  const setValue = useCallback((name: keyof T, value: T[keyof T]) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
        error: undefined, // Clear error when value changes
      },
    }))
  }, [])

  const setValues = useCallback((values: Partial<T>) => {
    setFields(prev => {
      const newFields = { ...prev }
      for (const key in values) {
        newFields[key as keyof T] = {
          ...newFields[key as keyof T],
          value: values[key as keyof T]!,
          error: undefined,
        }
      }
      return newFields
    })
  }, [])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!validateAll()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const values = {} as T
      for (const key in fields) {
        values[key] = fields[key].value
      }
      
      await onSubmit?.(values)
    } catch (error) {
      console.error("Form submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [fields, validateAll, onSubmit])

  const reset = useCallback(() => {
    const resetFields = {} as Record<keyof T, FormField<T[keyof T]>>
    for (const key in initialValues) {
      resetFields[key] = {
        value: initialValues[key],
        rules: validationRules[key],
      }
    }
    setFields(resetFields)
    setIsSubmitting(false)
  }, [initialValues, validationRules])

  const getValues = useCallback((): T => {
    const values = {} as T
    for (const key in fields) {
      values[key] = fields[key].value
    }
    return values
  }, [fields])

  const hasErrors = Object.values(fields).some(field => field.error)
  const isValid = !hasErrors

  return {
    fields,
    values: getValues(),
    setValue,
    setValues,
    validateField,
    validateAll,
    handleSubmit,
    reset,
    isValid,
    hasErrors,
    isSubmitting,
  }
}