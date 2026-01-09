/**
 * Hardcoded Duty Templates
 * 
 * Based on the restaurant's actual paper checklists:
 * - Pass Opening: Kitchen pass sanitation and prep
 * - Floor Opening: Dining room and terrace setup
 * - Closing: End-of-day cleanup and security
 * 
 * These templates define the structure that ChecklistInstances are created from.
 */

import type { DutyTemplate, TemplateMap, TemplatePreview, TemplateId } from '@/types';

/**
 * Pass Opening Checklist
 * 
 * Focus: Kitchen pass sanitation, mise en place, stock management
 * Source: PASS_daily_OPENING_checklist.csv
 */
export const PASS_OPENING_TEMPLATE: DutyTemplate = {
  id: 'pass_opening',
  name: 'Pass Opening Checklist',
  description: 'Kitchen pass prep, sanitation, and stock checks',
  type: 'opening',
  icon: 'utensils',
  accentColor: '#E07A5F', // Terracotta
  estimatedMinutes: 45,
  totalTasks: 32,
  sections: [
    {
      id: 'pass_initial',
      title: 'Initial Setup',
      area: 'general',
      order: 1,
      tasks: [
        {
          id: 'pass_1',
          title: 'Take BUTTER out of the fridge',
          area: 'prep_area',
          order: 1,
          priority: 'high',
        },
        {
          id: 'pass_2',
          title: 'Put bags in the bins then place them in each station',
          area: 'general',
          order: 2,
        },
        {
          id: 'pass_3',
          title: 'Relay carpets on the floor',
          area: 'general',
          order: 3,
        },
      ],
    },
    {
      id: 'pass_food_pass',
      title: 'Food Pass',
      area: 'food_pass',
      order: 2,
      tasks: [
        {
          id: 'pass_4',
          title: 'Sanitize all pass - attention to shelves',
          area: 'food_pass',
          order: 1,
          priority: 'high',
        },
        {
          id: 'pass_5',
          title: 'Remove all cloths from previous day',
          area: 'food_pass',
          order: 2,
        },
        {
          id: 'pass_6',
          title: 'Sanitize bell and clock - check time matches computer',
          area: 'food_pass',
          order: 3,
        },
        {
          id: 'pass_7',
          title: 'Set food pass with required items',
          details: [
            'Wooden cutlery holder',
            'Small glass with cocktail picks',
            'Rolled up cloth and hot water & vinegar bowl',
            '3 small plastic containers',
            'Hand sanitizer',
            'Blue saucers, side plates, starter plates',
            'POLISHED mussel pot lids',
            'Folded serviettes for wine',
          ],
          area: 'food_pass',
          order: 4,
        },
      ],
    },
    {
      id: 'pass_prep_area',
      title: 'Prep Area',
      area: 'prep_area',
      order: 3,
      tasks: [
        {
          id: 'pass_8',
          title: 'Clean/sanitize all surfaces',
          details: ['Computer, printers, tablets, and underneath!'],
          area: 'prep_area',
          order: 1,
          priority: 'high',
        },
        {
          id: 'pass_9',
          title: 'Sanitize and polish steel walls and cupboards',
          details: ['Use blue paper & pink spray', 'Including big wall at food pass'],
          area: 'prep_area',
          order: 2,
        },
        {
          id: 'pass_10',
          title: 'Clean trays with hot water & washing up liquid',
          details: [
            'BY HANDS - not in machine',
            'DO NOT dry under pass heater',
            'Do not stack trays behind water tap!',
          ],
          area: 'prep_area',
          order: 3,
          priority: 'high',
        },
        {
          id: 'pass_11',
          title: 'Refill blue paper and store in specific containers',
          area: 'prep_area',
          order: 4,
        },
        {
          id: 'pass_12',
          title: 'Refill hand soap dispenser in prep area and bar',
          area: 'prep_area',
          order: 5,
        },
        {
          id: 'pass_13',
          title: 'Sanitize outside and top of ice machine',
          details: [
            'Wash scoop and plastic container in dishwasher',
            'COLLECT IT BACK STRAIGHT AWAY!',
          ],
          area: 'prep_area',
          order: 6,
          priority: 'high',
        },
      ],
    },
    {
      id: 'pass_mise_en_place',
      title: 'Mise en Place Preparation',
      area: 'prep_area',
      order: 4,
      tasks: [
        {
          id: 'pass_14',
          title: 'WASH & SANITIZE hands, then prepare mayonnaise',
          area: 'prep_area',
          order: 1,
          priority: 'high',
        },
        {
          id: 'pass_15',
          title: 'Slice brown & white bread',
          details: ['Refresh in oven if needed', 'SAVE EXTRA FOR LATER'],
          area: 'prep_area',
          order: 2,
        },
        {
          id: 'pass_16',
          title: 'Prepare butter',
          area: 'prep_area',
          order: 3,
        },
        {
          id: 'pass_17',
          title: 'SANITIZE bread baskets and set up with paper',
          area: 'prep_area',
          order: 4,
        },
        {
          id: 'pass_18',
          title: 'Prepare olive oil and empty ramekins',
          area: 'prep_area',
          order: 5,
        },
        {
          id: 'pass_19',
          title: 'Set up takeaway containers, bags, wooden cutlery',
          area: 'prep_area',
          order: 6,
        },
      ],
    },
    {
      id: 'pass_drinks_pass',
      title: 'Drinks Pass',
      area: 'drink_pass',
      order: 5,
      tasks: [
        {
          id: 'pass_20',
          title: 'Refill and SANITIZE straw basket',
          area: 'drink_pass',
          order: 1,
        },
        {
          id: 'pass_21',
          title: 'Set up drink pass with side plates and saucers',
          area: 'drink_pass',
          order: 2,
        },
        {
          id: 'pass_22',
          title: 'Clean under the small metal bin',
          details: ['Brush and clean floor'],
          area: 'drink_pass',
          order: 3,
        },
        {
          id: 'pass_23',
          title: 'Dust top of display wine fridge before polishing frame & glass',
          area: 'drink_pass',
          order: 4,
        },
        {
          id: 'pass_24',
          title: 'Put the large & small trays cleaned with soapy water',
          area: 'drink_pass',
          order: 5,
        },
      ],
    },
    {
      id: 'pass_stock_check',
      title: 'Stock Check & Refill',
      area: 'general',
      order: 6,
      tasks: [
        {
          id: 'pass_25',
          title: 'Check stock: Thermal rolls (computer printers)',
          details: ['Bring from arches if missing'],
          area: 'prep_area',
          order: 1,
          requiresInput: true,
          inputLabel: 'Quantity',
          inputUnit: 'rolls',
        },
        {
          id: 'pass_26',
          title: 'Check stock: 2-ply rolls (pass printer)',
          area: 'prep_area',
          order: 2,
          requiresInput: true,
          inputLabel: 'Quantity',
          inputUnit: 'rolls',
        },
        {
          id: 'pass_27',
          title: 'Check stock: PDQ roll (card machine)',
          area: 'prep_area',
          order: 3,
        },
        {
          id: 'pass_28',
          title: 'Check stock: Ribbons for printer',
          area: 'prep_area',
          order: 4,
        },
        {
          id: 'pass_29',
          title: 'Check stock: Window cleaner, hand soap, blue paper',
          area: 'prep_area',
          order: 5,
        },
        {
          id: 'pass_30',
          title: 'Check stock: Red and blue j-cloths',
          area: 'prep_area',
          order: 6,
        },
        {
          id: 'pass_31',
          title: 'Check stock: Table napkins and service napkins',
          area: 'prep_area',
          order: 7,
        },
      ],
    },
    {
      id: 'pass_kitchen_refill',
      title: 'Kitchen Refill',
      area: 'food_pass',
      order: 7,
      tasks: [
        {
          id: 'pass_32',
          title: 'Place 4x 2-ply roll and 1x ribbon in kitchen',
          details: ['Next to head chef'],
          area: 'food_pass',
          order: 1,
          priority: 'high',
        },
        {
          id: 'pass_33',
          title: 'Refill washing up liquid bottle',
          area: 'prep_area',
          order: 2,
        },
        {
          id: 'pass_34',
          title: 'Refill polishing cloth and serviettes',
          area: 'prep_area',
          order: 3,
        },
      ],
    },
  ],
};

/**
 * Floor Opening Checklist
 * 
 * Focus: Dining room setup, table/chair arrangement, station stocking
 * Source: FLOOR__daily_OPENING.csv
 */
export const FLOOR_OPENING_TEMPLATE: DutyTemplate = {
  id: 'floor_opening',
  name: 'Floor Opening Checklist',
  description: 'Dining room, terrace, and station setup',
  type: 'opening',
  icon: 'layout',
  accentColor: '#3D5A80', // Navy blue
  estimatedMinutes: 50,
  totalTasks: 30,
  sections: [
    {
      id: 'floor_main',
      title: 'Main Floor',
      area: 'floor',
      order: 1,
      tasks: [
        {
          id: 'floor_1',
          title: 'Put all chairs down',
          area: 'floor',
          order: 1,
        },
        {
          id: 'floor_2',
          title: 'Clean marble top with sanitiser and dry with blue paper',
          area: 'floor',
          order: 2,
        },
        {
          id: 'floor_3',
          title: 'Clean all tables with hot water and soap',
          area: 'floor',
          order: 3,
        },
        {
          id: 'floor_4',
          title: 'Set up all the tables',
          area: 'floor',
          order: 4,
        },
        {
          id: 'floor_5',
          title: 'Check all salt and pepper are CLEAN and FULL',
          area: 'floor',
          order: 5,
        },
        {
          id: 'floor_6',
          title: 'Put salt and pepper on tables',
          details: ['Pepper facing the cathedral'],
          area: 'floor',
          order: 6,
          priority: 'high',
        },
        {
          id: 'floor_7',
          title: 'Clean zig-zag mirror around the bar',
          area: 'floor',
          order: 7,
        },
        {
          id: 'floor_8',
          title: 'Clean mirror above the counter',
          area: 'floor',
          order: 8,
        },
        {
          id: 'floor_9',
          title: 'Dust and clean metal frames around and top of bar',
          area: 'floor',
          order: 9,
        },
        {
          id: 'floor_10',
          title: 'Dust wood shelf with plants GENTLY!',
          area: 'floor',
          order: 10,
          priority: 'high',
        },
        {
          id: 'floor_11',
          title: 'Spot check windows inside and outside & Fish! glass sign',
          area: 'floor',
          order: 11,
        },
        {
          id: 'floor_12',
          title: 'Check floor for residue of food, glass, rubbish',
          details: ['Especially under tables'],
          area: 'floor',
          order: 12,
        },
        {
          id: 'floor_13',
          title: 'Clean banquettes with DAMP magic cloth',
          details: ['NO SANITIZER on banquettes', 'Check behind banquettes'],
          area: 'floor',
          order: 13,
          priority: 'high',
        },
        {
          id: 'floor_14',
          title: 'Polish all wine coolers, buckets and stands',
          area: 'floor',
          order: 14,
        },
        {
          id: 'floor_15',
          title: 'Straighten, align and work angles on tables',
          details: ['Use corks to level wobbly tables - NOT napkins'],
          area: 'floor',
          order: 15,
          priority: 'high',
        },
      ],
    },
    {
      id: 'floor_stations',
      title: 'Stations Setup',
      area: 'general',
      order: 2,
      tasks: [
        {
          id: 'floor_16',
          title: 'Sanitize all stations - ATTENTION TO ALL SHELVES',
          area: 'general',
          order: 1,
          priority: 'high',
        },
        {
          id: 'floor_17',
          title: 'Set station: 1 FULL hand sanitizer',
          area: 'general',
          order: 2,
        },
        {
          id: 'floor_18',
          title: 'Set station: 6 sugar bowls',
          area: 'general',
          order: 3,
        },
        {
          id: 'floor_19',
          title: 'Set station: 2 service plates',
          area: 'general',
          order: 4,
        },
        {
          id: 'floor_20',
          title: 'Set station: 6-8 ketchup & vinegar',
          area: 'general',
          order: 5,
        },
        {
          id: 'floor_21',
          title: 'Set station: 7 wine coolers',
          area: 'general',
          order: 6,
        },
        {
          id: 'floor_22',
          title: 'Set station: 2 cleaned yellow wet floor signs per station',
          details: ['Also 2 in prep area'],
          area: 'general',
          order: 7,
        },
        {
          id: 'floor_23',
          title: 'Set station: Spare credit card and till rolls',
          area: 'general',
          order: 8,
        },
        {
          id: 'floor_24',
          title: 'Set station: Table napkins',
          area: 'general',
          order: 9,
        },
        {
          id: 'floor_25',
          title: 'Set station: 6 bill trays minimum',
          area: 'general',
          order: 10,
        },
        {
          id: 'floor_26',
          title: 'Set station: 2 CLEAN tabasco sauce',
          details: ['Attention to cap cleanliness'],
          area: 'general',
          order: 11,
        },
        {
          id: 'floor_27',
          title: 'Set station: Extra cutlery',
          details: ['Lobster cracker/pick, steak knife, fish knife, soup spoon', 'Equally distributed'],
          area: 'general',
          order: 12,
        },
        {
          id: 'floor_28',
          title: 'Set station: Side plates, toothpicks glass, stapler & plastic wallet',
          area: 'general',
          order: 13,
        },
        {
          id: 'floor_29',
          title: 'Ensure every station has equal cutlery & glasses',
          area: 'general',
          order: 14,
        },
      ],
    },
    {
      id: 'floor_terrace',
      title: 'Terrace',
      area: 'terrace',
      order: 3,
      tasks: [
        {
          id: 'floor_30',
          title: 'Set up terrace station in full',
          area: 'terrace',
          order: 1,
        },
        {
          id: 'floor_31',
          title: 'USE CORK to fix wobbly tables - NOT NAPKINS',
          area: 'terrace',
          order: 2,
          priority: 'high',
        },
        {
          id: 'floor_32',
          title: 'Spot check terrace windows, clean grey frames',
          area: 'terrace',
          order: 3,
        },
        {
          id: 'floor_33',
          title: 'Check for food residue in between table slats',
          area: 'terrace',
          order: 4,
        },
        {
          id: 'floor_34',
          title: 'Make sure you have 2 bins with bags in',
          area: 'terrace',
          order: 5,
        },
        {
          id: 'floor_35',
          title: 'Sweep the terrace floor',
          area: 'terrace',
          order: 6,
        },
      ],
    },
  ],
};

/**
 * Closing Checklist
 * 
 * Focus: End-of-day cleanup, station emptying, security protocols
 * Source: FLOOR_daily_CLOSING.csv
 * 
 * Note: Time-sensitive tasks grouped by time window (before 10pm, after 10pm, after 11pm)
 */
export const CLOSING_TEMPLATE: DutyTemplate = {
  id: 'closing',
  name: 'Closing Checklist',
  description: 'End-of-day cleanup and security',
  type: 'closing',
  icon: 'moon',
  accentColor: '#6B4C9A', // Purple
  estimatedMinutes: 60,
  totalTasks: 38,
  sections: [
    {
      id: 'close_station_1',
      title: 'Station 1',
      area: 'station_1',
      order: 1,
      timeWindow: 'anytime',
      tasks: [
        {
          id: 'close_1',
          title: 'EMPTY and CLEAN station with hot water & washing up liquid',
          details: ['All shelves'],
          area: 'station_1',
          order: 1,
        },
        {
          id: 'close_2',
          title: 'Regroup salt and pepper under the station',
          area: 'station_1',
          order: 2,
        },
        {
          id: 'close_3',
          title: 'Wipe & top up salt & pepper',
          area: 'station_1',
          order: 3,
        },
        {
          id: 'close_4',
          title: 'Empty bins in station & clean inside cupboard',
          details: ['Use hot water & washing up liquid'],
          area: 'station_1',
          order: 4,
        },
      ],
    },
    {
      id: 'close_station_3',
      title: 'Station 3',
      area: 'station_3',
      order: 2,
      timeWindow: 'anytime',
      tasks: [
        {
          id: 'close_5',
          title: 'Clean & polish bill trays',
          area: 'station_3',
          order: 1,
        },
        {
          id: 'close_6',
          title: 'Refill sugar pots if necessary',
          area: 'station_3',
          order: 2,
        },
        {
          id: 'close_7',
          title: 'EMPTY and CLEAN Station 3 with hot water & washing up liquid',
          details: ['All shelves'],
          area: 'station_3',
          order: 3,
        },
        {
          id: 'close_8',
          title: 'Empty bins in station & clean inside cupboard',
          area: 'station_3',
          order: 4,
        },
      ],
    },
    {
      id: 'close_station_456',
      title: 'Station 4/5/6',
      area: 'station_4_5_6',
      order: 3,
      timeWindow: 'anytime',
      tasks: [
        {
          id: 'close_9',
          title: 'EMPTY and CLEAN inside/out Station 6',
          details: ['All shelves', 'Use hot water & washing up liquid'],
          area: 'station_4_5_6',
          order: 1,
        },
        {
          id: 'close_10',
          title: 'Wipe & top up salt & pepper',
          area: 'station_4_5_6',
          order: 2,
        },
        {
          id: 'close_11',
          title: 'Empty bins in station & clean inside cupboard & frames',
          area: 'station_4_5_6',
          order: 3,
        },
        {
          id: 'close_12',
          title: 'Clear mise en place from tables and counter',
          area: 'station_4_5_6',
          order: 4,
        },
        {
          id: 'close_13',
          title: 'Clean and polish counter top',
          details: ['Use sanitizer and dry with blue paper'],
          area: 'station_4_5_6',
          order: 5,
        },
      ],
    },
    {
      id: 'close_drink_pass',
      title: 'Drink Pass',
      area: 'drink_pass',
      order: 4,
      timeWindow: 'anytime',
      tasks: [
        {
          id: 'close_14',
          title: 'Move bar equipment to Station 1',
          area: 'drink_pass',
          order: 1,
        },
        {
          id: 'close_15',
          title: 'Clean drink pass with hot water & washing up liquid',
          area: 'drink_pass',
          order: 2,
        },
        {
          id: 'close_16',
          title: 'Clean shelves with staff drinks',
          area: 'drink_pass',
          order: 3,
        },
        {
          id: 'close_17',
          title: 'Remove dirty cloths',
          area: 'drink_pass',
          order: 4,
        },
        {
          id: 'close_18',
          title: 'Empty bins in prep area & wash them including lids',
          area: 'drink_pass',
          order: 5,
        },
        {
          id: 'close_19',
          title: 'Clean under glass sink, around it, and wipe both metal bins',
          area: 'drink_pass',
          order: 6,
        },
      ],
    },
    {
      id: 'close_floor_cleaning',
      title: 'Floor & Tables',
      area: 'floor',
      order: 5,
      timeWindow: 'anytime',
      tasks: [
        {
          id: 'close_20',
          title: 'Clean all table tops sections 4/5/6',
          details: ['Hot water & washing up liquid with j-cloth'],
          area: 'floor',
          order: 1,
        },
        {
          id: 'close_21',
          title: 'Clean all table tops sections 1/3',
          details: ['Hot water & washing up liquid with j-cloth'],
          area: 'floor',
          order: 2,
        },
        {
          id: 'close_22',
          title: 'Wipe chairs sections 1 & 3 using MAGIC CLOTH',
          area: 'floor',
          order: 3,
        },
        {
          id: 'close_23',
          title: 'Wipe chairs sections 4, 5, 6 & by counter using MAGIC CLOTH',
          area: 'floor',
          order: 4,
        },
        {
          id: 'close_24',
          title: 'Sweep floor sections 1 & 3',
          area: 'floor',
          order: 5,
        },
        {
          id: 'close_25',
          title: 'Sweep floor sections 4, 5, 6',
          area: 'floor',
          order: 6,
        },
        {
          id: 'close_26',
          title: 'Put chairs up',
          details: ['Only if no customers in restaurant!'],
          area: 'floor',
          order: 7,
          priority: 'high',
        },
        {
          id: 'close_27',
          title: 'Refill ALL staplers',
          area: 'floor',
          order: 8,
        },
        {
          id: 'close_28',
          title: 'Wipe over banquettes with DAMP magic cloth',
          details: ['Check behind banquettes if clean'],
          area: 'floor',
          order: 9,
        },
      ],
    },
    {
      id: 'close_terrace',
      title: 'Terrace',
      area: 'terrace',
      order: 6,
      timeWindow: 'before_10pm',
      tasks: [
        {
          id: 'close_29',
          title: 'Clear mise en place on outside tables',
          area: 'terrace',
          order: 1,
        },
        {
          id: 'close_30',
          title: 'Clean terrace tables @ 10:00 PM',
          details: ['Hot water & washing up liquid'],
          area: 'terrace',
          order: 2,
          timeWindow: 'before_10pm',
          priority: 'high',
        },
        {
          id: 'close_31',
          title: 'Wipe and top up salt & pepper',
          area: 'terrace',
          order: 3,
        },
        {
          id: 'close_32',
          title: 'Empty bins & bring in wait sign',
          area: 'terrace',
          order: 4,
        },
        {
          id: 'close_33',
          title: 'Sweep ENTIRE terrace',
          area: 'terrace',
          order: 5,
        },
        {
          id: 'close_34',
          title: 'EMPTY and CLEAN outside station',
          details: ['Hot water & washing up liquid'],
          area: 'terrace',
          order: 6,
        },
      ],
    },
    {
      id: 'close_food_pass',
      title: 'Food Pass & Prep',
      area: 'food_pass',
      order: 7,
      timeWindow: 'anytime',
      tasks: [
        {
          id: 'close_35',
          title: 'Clean & fill up ketchup and vinegar',
          details: ['NO BUBBLES!', 'Make sure vinegar is covered with napkin'],
          area: 'food_pass',
          order: 1,
          priority: 'high',
        },
        {
          id: 'close_36',
          title: 'Wash ice scoop & bucket for ice',
          details: ['Give to KP and collect back - do not lose it!'],
          area: 'food_pass',
          order: 2,
        },
        {
          id: 'close_37',
          title: 'EMPTY, CLEAN & SANITISE preparation area',
          details: ['Hot water & washing up liquid'],
          area: 'food_pass',
          order: 3,
        },
        {
          id: 'close_38',
          title: 'Clean sink & hand wash in prep',
          area: 'food_pass',
          order: 4,
        },
        {
          id: 'close_39',
          title: 'Polish side plates and coffee saucers',
          area: 'food_pass',
          order: 5,
        },
        {
          id: 'close_40',
          title: 'Wipe under & behind the computer',
          area: 'food_pass',
          order: 6,
        },
        {
          id: 'close_41',
          title: 'Clean shelf under sink in prep area',
          area: 'food_pass',
          order: 7,
        },
        {
          id: 'close_42',
          title: 'EMPTY and CLEAN food pass & all shelving',
          area: 'food_pass',
          order: 8,
        },
        {
          id: 'close_43',
          title: 'Sweep under all prep area, under ice machine',
          details: ['Pull out prep fridge and sanitize top'],
          area: 'food_pass',
          order: 9,
        },
        {
          id: 'close_44',
          title: 'Give leftover bread to chef',
          area: 'food_pass',
          order: 10,
        },
      ],
    },
    {
      id: 'close_final',
      title: 'Final Checks & Security',
      area: 'reception',
      order: 8,
      timeWindow: 'after_11pm',
      tasks: [
        {
          id: 'close_45',
          title: '****SWITCH OFF TOP LIGHTS****',
          area: 'general',
          order: 1,
          priority: 'high',
        },
        {
          id: 'close_46',
          title: 'Remove all wine stands from floor',
          details: ['Leave behind reception desk'],
          area: 'reception',
          order: 2,
        },
        {
          id: 'close_47',
          title: 'MOVE ALL BINS, LADDER, YELLOW SIGNS, HOOVER to reception',
          details: ['AFTER 11PM', 'Collect all bins, dry them, make sure clean'],
          area: 'reception',
          order: 3,
          timeWindow: 'after_11pm',
          priority: 'high',
        },
        {
          id: 'close_48',
          title: 'Brush entire prep area',
          details: ['Under sink, under ice machine', 'Check every corner'],
          area: 'prep_area',
          order: 4,
        },
        {
          id: 'close_49',
          title: 'Remove last bins from glass pass area',
          details: ['Make sure nothing left in sink'],
          area: 'food_pass',
          order: 5,
        },
      ],
    },
  ],
};

/**
 * All templates as a map for easy lookup
 */
export const TEMPLATES: TemplateMap = {
  pass_opening: PASS_OPENING_TEMPLATE,
  floor_opening: FLOOR_OPENING_TEMPLATE,
  closing: CLOSING_TEMPLATE,
};

/**
 * Template previews for selection screen
 */
export const TEMPLATE_PREVIEWS: TemplatePreview[] = [
  {
    id: 'pass_opening',
    name: PASS_OPENING_TEMPLATE.name,
    description: PASS_OPENING_TEMPLATE.description,
    totalTasks: PASS_OPENING_TEMPLATE.totalTasks,
    estimatedMinutes: PASS_OPENING_TEMPLATE.estimatedMinutes,
    icon: PASS_OPENING_TEMPLATE.icon,
    accentColor: PASS_OPENING_TEMPLATE.accentColor,
  },
  {
    id: 'floor_opening',
    name: FLOOR_OPENING_TEMPLATE.name,
    description: FLOOR_OPENING_TEMPLATE.description,
    totalTasks: FLOOR_OPENING_TEMPLATE.totalTasks,
    estimatedMinutes: FLOOR_OPENING_TEMPLATE.estimatedMinutes,
    icon: FLOOR_OPENING_TEMPLATE.icon,
    accentColor: FLOOR_OPENING_TEMPLATE.accentColor,
  },
  {
    id: 'closing',
    name: CLOSING_TEMPLATE.name,
    description: CLOSING_TEMPLATE.description,
    totalTasks: CLOSING_TEMPLATE.totalTasks,
    estimatedMinutes: CLOSING_TEMPLATE.estimatedMinutes,
    icon: CLOSING_TEMPLATE.icon,
    accentColor: CLOSING_TEMPLATE.accentColor,
  },
];

/**
 * Get template by ID
 */
export function getTemplate(id: TemplateId): DutyTemplate {
  return TEMPLATES[id];
}

/**
 * Get all task IDs for a template (flattened)
 */
export function getAllTaskIds(template: DutyTemplate): string[] {
  return template.sections.flatMap(section => 
    section.tasks.map(task => task.id)
  );
}
