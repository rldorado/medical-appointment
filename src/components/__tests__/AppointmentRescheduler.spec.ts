import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises, VueWrapper } from '@vue/test-utils'
import AppointmentRescheduler from '../AppointmentRescheduler.vue'
import { getWeeklySlots } from '@/services/appointmentService'
import type { Slot, WeeklySlots } from '@/types/Slot'

// Mock store data
const mockStoreData = {
  currentAppointment: {
    id: '123',
    doctor: 'Dr. Smith',
    specialty: 'Cardiology',
    date: new Date('2025-03-15T10:00:00'),
    formattedDate: 'March 15, 2025 at 10:00 AM'
  },
  isRescheduling: false,
  isReschedulingSpinner: false,
  errorMessage: '',
  clearError: vi.fn(),
  rescheduleAppointment: vi.fn().mockResolvedValue(true)
}

// Mock the appointment store
vi.mock('@/stores/appointmentStore', () => ({
  useAppointmentStore: vi.fn(() => mockStoreData)
}))

// Mock the appointment service
vi.mock('@/services/appointmentService', () => ({
  getWeeklySlots: vi.fn()
}))

// Mock the date utils
vi.mock('@/utils/dateUtils', () => ({
  formatDateForApi: vi.fn((date) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
  }),
  formatDateForDisplay: vi.fn(() => 'March 15, 2025'),
  formatTimeForDisplay: vi.fn(() => '10:00 AM'),
  formatDateToYYYYMMDD: vi.fn(),
  getNextSevenDays: vi.fn()
}))

describe('AppointmentRescheduler', () => {
  let wrapper: VueWrapper
  
  // Mock weekly slots data
  const mockWeeklySlots: WeeklySlots[] = [
    {
      date: '2025-03-10',
      slots: [
        { start: '2025-03-10T09:00:00', end: '2025-03-10T09:30:00', available: true },
        { start: '2025-03-10T09:30:00', end: '2025-03-10T10:00:00', available: true }
      ]
    }
  ]
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Reset store mock data
    mockStoreData.errorMessage = ''
    mockStoreData.isRescheduling = false
    mockStoreData.isReschedulingSpinner = false
    mockStoreData.rescheduleAppointment.mockClear()
    mockStoreData.clearError.mockClear()
    
    // Mock getWeeklySlots to return test data
    vi.mocked(getWeeklySlots).mockResolvedValue(mockWeeklySlots)
    
    // Mount component with shallow mounting to stub child components
    wrapper = mount(AppointmentRescheduler, {
      global: {
        stubs: {
          // Use true for automatic stubbing of components
          SlotCalendar: {
            template: '<div class="mock-slot-calendar">Slot Calendar</div>',
            props: ['weeklySlots', 'isLoading'],
            emits: ['select-slot', 'week-change']
          },
          AppointmentInfo: {
            template: '<div class="mock-appointment-info">{{ appointmentDate }}</div>',
            props: ['appointmentDate']
          },
          'v-card': {
            template: '<div class="v-card"><slot></slot></div>'
          },
          'v-card-title': {
            template: '<div class="v-card-title"><slot></slot></div>'
          },
          'v-card-text': {
            template: '<div class="v-card-text"><slot></slot></div>'
          },
          'v-alert': {
            template: '<div class="v-alert"><slot></slot></div>'
          },
          'v-progress-linear': true,
          'v-progress-circular': true,
          'v-btn': {
            template: '<button class="v-btn"><slot></slot></button>'
          }
        }
      }
    })
  })
  
  afterEach(() => {
    wrapper.unmount()
  })
  
  it('renders the component correctly', () => {
    expect(wrapper.exists()).toBe(true)
    // Check for the existence of child components by class name
    expect(wrapper.find('.mock-appointment-info').exists()).toBe(true)
    expect(wrapper.find('.mock-slot-calendar').exists()).toBe(true)
  })
  
  it('displays doctor name from the store', () => {
    // The doctor name should be in the v-card-title
    const cardTitle = wrapper.find('.v-card-title')
    expect(cardTitle.text()).toContain('Dr. Smith')
  })
  
  it('loads slots on mount', async () => {
    // Wait for promises to resolve
    await flushPromises()
    
    // Check if getWeeklySlots was called
    expect(getWeeklySlots).toHaveBeenCalled()
  })
  
  it('handles slot selection', async () => {
    const testSlot: Slot = { 
      start: '2025-03-10T09:00:00', 
      end: '2025-03-10T09:30:00', 
      available: true 
    }
    
    // Get the component instance
    const vm = wrapper.vm as any
    
    // Call the method directly
    vm.handleSlotSelect(testSlot)
    
    // Wait for the UI to update
    await wrapper.vm.$nextTick()
    
    // Verify the internal state changed
    expect(vm.selectedSlot).toEqual(testSlot)
    
    // Create a new wrapper with a different approach
    const newWrapper = mount(AppointmentRescheduler, {
      global: {
        stubs: {
          SlotCalendar: {
            template: '<div class="mock-slot-calendar">Slot Calendar</div>',
            props: ['weeklySlots', 'isLoading'],
            emits: ['select-slot', 'week-change']
          },
          AppointmentInfo: {
            template: '<div class="mock-appointment-info">{{ appointmentDate }}</div>',
            props: ['appointmentDate']
          },
          'v-card': {
            template: '<div class="v-card"><slot></slot></div>'
          },
          'v-card-title': {
            template: '<div class="v-card-title"><slot></slot></div>'
          },
          'v-card-text': {
            template: '<div class="v-card-text"><slot></slot></div>'
          },
          'v-alert': {
            template: '<div class="v-alert"><slot></slot></div>'
          },
          'v-progress-linear': true,
          'v-progress-circular': true,
          'v-btn': {
            template: '<button class="v-btn"><slot></slot></button>'
          }
        }
      }
    })
    
    // Directly manipulate the component's data
    const newVm = newWrapper.vm as any
    newVm.selectedSlot = testSlot
    
    // Wait for the UI to update
    await newWrapper.vm.$nextTick()
    
    // Now check if the reschedule section is rendered by looking for the text
    expect(newWrapper.text()).toContain('Reschedule')
    
    // Clean up
    newWrapper.unmount()
  })
  
  it('handles week change', async () => {
    const newDate = new Date('2025-03-17')
    
    // Reset the mock to verify it's called with the new date
    vi.mocked(getWeeklySlots).mockClear()
    
    // Get the component instance
    const vm = wrapper.vm as any
    
    // Call the method directly
    await vm.handleWeekChange(newDate)
    
    // Check if getWeeklySlots was called with the formatted date
    expect(getWeeklySlots).toHaveBeenCalledWith('20250317')
  })
  
  it('handles reschedule confirmation', async () => {
    const testSlot: Slot = { 
      start: '2025-03-10T09:00:00', 
      end: '2025-03-10T09:30:00', 
      available: true 
    }
    
    // Get the component instance
    const vm = wrapper.vm as any
    
    // Set the selected slot directly
    vm.selectedSlot = testSlot
    
    // Wait for the UI to update
    await wrapper.vm.$nextTick()
    
    // Call the method directly
    await vm.confirmReschedule()
    
    // Check if rescheduleAppointment was called with the correct slot
    expect(mockStoreData.rescheduleAppointment).toHaveBeenCalledWith(testSlot)
    
    // Selected slot should be cleared after successful reschedule
    expect(vm.selectedSlot).toBeNull()
  })
  
  it('handles error during slot loading', async () => {
    // Unmount the current wrapper
    wrapper.unmount()
    
    // Mock getWeeklySlots to throw an error
    vi.mocked(getWeeklySlots).mockRejectedValueOnce(new Error('API error'))
    
    // Mount component again
    wrapper = mount(AppointmentRescheduler, {
      global: {
        stubs: {
          SlotCalendar: {
            template: '<div class="mock-slot-calendar">Slot Calendar</div>',
            props: ['weeklySlots', 'isLoading'],
            emits: ['select-slot', 'week-change']
          },
          AppointmentInfo: {
            template: '<div class="mock-appointment-info">{{ appointmentDate }}</div>',
            props: ['appointmentDate']
          },
          'v-card': {
            template: '<div class="v-card"><slot></slot></div>'
          },
          'v-card-title': {
            template: '<div class="v-card-title"><slot></slot></div>'
          },
          'v-card-text': {
            template: '<div class="v-card-text"><slot></slot></div>'
          },
          'v-alert': {
            template: '<div class="v-alert"><slot></slot></div>'
          },
          'v-progress-linear': true,
          'v-progress-circular': true,
          'v-btn': {
            template: '<button class="v-btn"><slot></slot></button>'
          }
        }
      }
    })
    
    // Get the component instance
    const vm = wrapper.vm as any
    
    // Call the method directly
    await vm.loadSlotsForDate(new Date())
    
    // Wait for promises to resolve
    await flushPromises()
    
    // Check if error message was set
    expect(vm.errorMessage).toBeTruthy()
    expect(vm.errorMessage).toContain('Failed to load')
  })
  
  it('handles error during reschedule', async () => {
    const testSlot: Slot = { 
      start: '2025-03-10T09:00:00', 
      end: '2025-03-10T09:30:00', 
      available: true 
    }
    
    // Mock the store to return failure
    mockStoreData.rescheduleAppointment.mockResolvedValueOnce(false)
    
    // Set error message in the store
    mockStoreData.errorMessage = 'Failed to reschedule'
    
    // Get the component instance
    const vm = wrapper.vm as any
    
    // Set the selected slot directly
    vm.selectedSlot = testSlot
    
    // Wait for the UI to update
    await wrapper.vm.$nextTick()
    
    // Call the method directly
    await vm.confirmReschedule()
    
    // Wait for promises to resolve
    await flushPromises()
    
    // Check if error message was set from the store
    expect(vm.errorMessage).toBe('Failed to reschedule')
  })
  
  it('clears error messages', async () => {
    // Get the component instance
    const vm = wrapper.vm as any
    
    // Set an error message directly
    vm.errorMessage = 'Test error'
    
    // Wait for the UI to update
    await wrapper.vm.$nextTick()
    
    // Call the method directly
    vm.clearError()
    
    // Check if error was cleared
    expect(vm.errorMessage).toBe('')
    
    // Check if store's clearError was called
    expect(mockStoreData.clearError).toHaveBeenCalled()
  })
})
