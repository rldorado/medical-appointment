import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getWeeklySlots, bookSlot } from '../appointmentService'
import { API_CONFIG } from '@/config/api'
import { getNextSevenDays, formatDateToYYYYMMDD } from '@/utils/dateUtils'

// Mock fetch
global.fetch = vi.fn()

describe('appointmentService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('getWeeklySlots', () => {
    it('fetches and formats weekly slots correctly', async () => {
      // Mock API response
      const mockSlots = [
        { Start: '2025-03-10T09:00:00', End: '2025-03-10T09:30:00', Taken: false },
        { Start: '2025-03-10T10:00:00', End: '2025-03-10T10:30:00', Taken: true },
        { Start: '2025-03-11T09:00:00', End: '2025-03-11T09:30:00', Taken: false }
      ]

      // Setup fetch mock
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockSlots)
      } as unknown as Response)

      // Call the service
      const date = '20250310' // March 10, 2025 (Monday)
      const result = await getWeeklySlots(date)

      // Verify fetch was called with correct URL
      expect(fetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.WEEKLY_SLOTS}${date}`
      )

      // Verify result structure
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBe(7) // 7 days in a week

      // Convert date string to Date object for comparison
      const startDate = new Date(2025, 2, 10) // March 10, 2025
      const weekDates = getNextSevenDays(startDate)
      
      // Verify each day in the result
      weekDates.forEach((date, index) => {
        const dateStr = formatDateToYYYYMMDD(date)
        expect(result[index].date).toBe(dateStr)
      })

      // Verify slots for March 10
      const march10 = result.find(day => day.date === '2025-03-10')
      expect(march10?.slots.length).toBe(2)
      expect(march10?.slots[0]).toEqual({
        start: '2025-03-10T09:00:00',
        end: '2025-03-10T09:30:00',
        available: true
      })
      expect(march10?.slots[1]).toEqual({
        start: '2025-03-10T10:00:00',
        end: '2025-03-10T10:30:00',
        available: false
      })

      // Verify slots for March 11
      const march11 = result.find(day => day.date === '2025-03-11')
      expect(march11?.slots.length).toBe(1)
      expect(march11?.slots[0]).toEqual({
        start: '2025-03-11T09:00:00',
        end: '2025-03-11T09:30:00',
        available: true
      })

      // Verify empty slots for other days
      const otherDays = result.filter(day => !['2025-03-10', '2025-03-11'].includes(day.date))
      otherDays.forEach(day => {
        expect(day.slots).toEqual([])
      })
    })

    it('handles API errors gracefully', async () => {
      // Setup fetch mock to return an error
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValueOnce('Internal Server Error')
      } as unknown as Response)

      // Call the service and expect it to throw
      const date = '20250310'
      await expect(getWeeklySlots(date)).rejects.toThrow('API error 500')
    })

    it('handles non-array API responses', async () => {
      // Mock API response as an object instead of array
      const mockSlot = { 
        Start: '2025-03-10T09:00:00', 
        End: '2025-03-10T09:30:00', 
        Taken: false 
      }

      // Setup fetch mock
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockSlot)
      } as unknown as Response)

      // Call the service
      const date = '20250310'
      const result = await getWeeklySlots(date)

      // Verify result contains the single slot properly formatted
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBe(7) // 7 days in a week

      // Find the day with the slot
      const dayWithSlot = result.find(day => day.date === '2025-03-10')
      expect(dayWithSlot?.slots.length).toBe(1)
      expect(dayWithSlot?.slots[0]).toEqual({
        start: '2025-03-10T09:00:00',
        end: '2025-03-10T09:30:00',
        available: true
      })
    })
  })

  describe('bookSlot', () => {
    it('books a slot successfully with JSON response', async () => {
      // Mock booking data
      const bookingData = {
        Start: '2025-03-10T09:00:00',
        End: '2025-03-10T09:30:00',
        Comments: 'Test booking',
        Patient: { 
          Name: 'Test',
          SecondName: 'Patient',
          Email: 'test@example.com',
          Phone: '123456789'
        }
      }

      // Mock successful response
      const mockResponse = {
        success: true,
        message: 'Appointment booked successfully'
      }

      // Setup fetch mock
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValueOnce(JSON.stringify(mockResponse))
      } as unknown as Response)

      // Call the service
      const result = await bookSlot(bookingData)

      // Verify fetch was called with correct params
      expect(fetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOK_SLOT}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData),
        }
      )

      // Verify result
      expect(result).toEqual(mockResponse)
    })

    it('handles empty response as success', async () => {
      // Mock booking data
      const bookingData = {
        Start: '2025-03-10T09:00:00',
        End: '2025-03-10T09:30:00',
        Comments: 'Test booking',
        Patient: { 
          Name: 'Test',
          SecondName: 'Patient',
          Email: 'test@example.com',
          Phone: '123456789'
        }
      }

      // Setup fetch mock with empty response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValueOnce('')
      } as unknown as Response)

      // Call the service
      const result = await bookSlot(bookingData)

      // Verify result is a success
      expect(result.success).toBe(true)
      expect(result.message).toContain('successfully')
    })

    it('handles non-JSON response as success', async () => {
      // Mock booking data
      const bookingData = {
        Start: '2025-03-10T09:00:00',
        End: '2025-03-10T09:30:00',
        Comments: 'Test booking',
        Patient: { 
          Name: 'Test',
          SecondName: 'Patient',
          Email: 'test@example.com',
          Phone: '123456789'
        }
      }

      // Setup fetch mock with non-JSON response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValueOnce('OK')
      } as unknown as Response)

      // Call the service
      const result = await bookSlot(bookingData)

      // Verify result is a success
      expect(result.success).toBe(true)
      expect(result.message).toContain('not in JSON format')
    })

    it('handles API errors gracefully', async () => {
      // Mock booking data
      const bookingData = {
        Start: '2025-03-10T09:00:00',
        End: '2025-03-10T09:30:00',
        Comments: 'Test booking',
        Patient: { 
          Name: 'Test',
          SecondName: 'Patient',
          Email: 'test@example.com',
          Phone: '123456789'
        }
      }

      // Setup fetch mock to return an error
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValueOnce('Bad Request')
      } as unknown as Response)

      // Call the service and expect it to throw
      await expect(bookSlot(bookingData)).rejects.toThrow('API error 400')
    })
  })
})
