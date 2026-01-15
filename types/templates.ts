/**
 * Duty Template Type Definitions
 * 
 * Templates define the structure of checklists. They are hardcoded in the app
 * based on the restaurant's specific requirements:
 * - Pass Opening: Kitchen pass sanitation and prep
 * - Floor Opening: Dining room and terrace setup
 * - Closing: End-of-day cleanup and security
 */

/**
 * Unique identifiers for the three duty templates
 */
export type TemplateId = 'pass_opening' | 'floor_opening' | 'closing';

/**
 * Time windows for closing tasks (affects UI grouping and reminders)
 */
export type TimeWindow = 'anytime' | 'before_10pm' | 'after_10pm' | 'after_11pm';

/**
 * Areas/sections within the restaurant
 */
export type RestaurantArea = 
  | 'food_pass'
  | 'drink_pass'
  | 'prep_area'
  | 'floor'
  | 'terrace'
  | 'station_1'
  | 'station_3'
  | 'station_4_5_6'
  | 'terrace_station'
  | 'reception'
  | 'general';

/**
 * Individual task within a template
 */
export interface DutyTask {
  /** Unique task ID within template (e.g., 'pass_opening_1') */
  id: string;
  
  /** Primary task description */
  title: string;
  
  /** 
   * Additional details/instructions shown below title
   * Supports multiple lines for complex tasks
   */
  details?: string[];
  
  /** Restaurant area this task belongs to */
  area: RestaurantArea;
  
  /** 
   * Whether task requires numeric input (e.g., temperature, quantity)
   * If true, shows input field alongside checkbox
   */
  requiresInput?: boolean;
  
  /** Label for input field if requiresInput is true */
  inputLabel?: string;
  
  /** Unit for input (e.g., '°C', 'rolls', 'bottles') */
  inputUnit?: string;
  
  /** For closing tasks: when should this be done? */
  timeWindow?: TimeWindow;
  
  /** 
   * Emphasis level for critical tasks
   * 'high' tasks are visually highlighted
   */
  priority?: 'normal' | 'high';
  
  /** Order within section (for sorting) */
  order: number;
}

/**
 * Section groups related tasks together
 */
export interface TemplateSection {
  /** Section identifier */
  id: string;
  
  /** Display title for section header */
  title: string;
  
  /** Restaurant area this section covers */
  area: RestaurantArea;
  
  /** Tasks within this section */
  tasks: DutyTask[];
  
  /** Time window for closing sections */
  timeWindow?: TimeWindow;
  
  /** Order within template */
  order: number;
}

/**
 * Display type shown in template list
 */
export type TemplateDisplayType = 'Yes/No/N.A. check' | 'Table';

/**
 * Complete duty template definition
 */
export interface DutyTemplate {
  /** Unique template identifier */
  id: TemplateId;

  /** Display name (e.g., 'Pass Opening Checklist') */
  name: string;

  /** Short description shown on selection screen */
  description: string;

  /**
   * Template type affects available features
   * - 'opening': Morning prep tasks
   * - 'closing': End-of-day with time-based sections
   */
  type: 'opening' | 'closing';

  /** Display type shown in template list (e.g., 'Yes/No/N.A. check') */
  displayType: TemplateDisplayType;

  /** Sections containing grouped tasks */
  sections: TemplateSection[];

  /** Total number of tasks (computed) */
  totalTasks: number;

  /** Estimated completion time in minutes */
  estimatedMinutes: number;

  /** Icon identifier for UI */
  icon: 'utensils' | 'layout' | 'moon';

  /** Accent color for template card */
  accentColor: string;
}

/**
 * Template metadata for selection screen (lighter weight)
 */
export interface TemplatePreview {
  id: TemplateId;
  name: string;
  description: string;
  displayType: TemplateDisplayType;
  totalTasks: number;
  estimatedMinutes: number;
  icon: DutyTemplate['icon'];
  accentColor: string;
}

/**
 * Helper type for template lookup
 */
export type TemplateMap = Record<TemplateId, DutyTemplate>;
