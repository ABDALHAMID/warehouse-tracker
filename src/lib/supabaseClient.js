import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
)

// Official Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Initial Building Materials seed data for warehouse tracker
export const INITIAL_ITEMS = [
  {
    id: 'cem-001',
    sku: 'CEM-45-001',
    name: 'Portland Cement CPJ 45 (50kg)',
    category: 'cement',
    current_stock: 350,
    min_stock_level: 100,
    unit: 'bags',
    location: 'Aisle A-01, Pallet 3',
    description: 'High strength hydraulic binder for reinforced concrete foundations and slabs.'
  },
  {
    id: 'cem-002',
    sku: 'CEM-35-002',
    name: 'White Portland Cement CPJ 35 (25kg)',
    category: 'cement',
    current_stock: 18,
    min_stock_level: 40,
    unit: 'bags',
    location: 'Aisle A-02, Shelf 1',
    description: 'Premium white cement for architectural finishes, terrazzo, and masonry mortar.'
  },
  {
    id: 'stl-101',
    sku: 'STL-12-101',
    name: 'Deformed Rebar FeE500 Ø12mm (12m)',
    category: 'steel',
    current_stock: 820,
    min_stock_level: 250,
    unit: 'pieces',
    location: 'Yard Bay B-01',
    description: 'High tensile ribbed steel bar for structural beams and reinforced columns.'
  },
  {
    id: 'stl-102',
    sku: 'STL-16-102',
    name: 'Deformed Rebar FeE500 Ø16mm (12m)',
    category: 'steel',
    current_stock: 45,
    min_stock_level: 150,
    unit: 'pieces',
    location: 'Yard Bay B-02',
    description: 'Heavy duty reinforcement steel bar for heavy civil foundations.'
  },
  {
    id: 'stl-103',
    sku: 'STL-MSH-103',
    name: 'Welded Wire Mesh PAF-C 2.4x6m',
    category: 'steel',
    current_stock: 110,
    min_stock_level: 40,
    unit: 'pieces',
    location: 'Yard Bay B-04',
    description: 'Electrowelded mesh 150x150x6mm for ground slabs and screeds.'
  },
  {
    id: 'brk-201',
    sku: 'BRK-06-201',
    name: 'Red Hollow Clay Bricks 6-Hole (20x20x10)',
    category: 'bricks',
    current_stock: 2400,
    min_stock_level: 600,
    unit: 'pieces',
    location: 'Yard Stack C-01',
    description: 'Standard terracotta hollow partition bricks for interior masonry walls.'
  },
  {
    id: 'brk-202',
    sku: 'BRK-BLK-202',
    name: 'Concrete Hollow Blocks (15x20x40cm)',
    category: 'bricks',
    current_stock: 75,
    min_stock_level: 300,
    unit: 'pieces',
    location: 'Yard Stack C-03',
    description: 'Vibrated load-bearing concrete parpaings for perimeter and retaining walls.'
  },
  {
    id: 'tmb-301',
    sku: 'TMB-PLK-301',
    name: 'Treated Pinewood Formwork Planks (4m x 15cm x 25mm)',
    category: 'timber',
    current_stock: 280,
    min_stock_level: 100,
    unit: 'pieces',
    location: 'Shed D-01',
    description: 'Kiln-dried Scandinavian red pine planks for concrete shuttering.'
  },
  {
    id: 'tmb-302',
    sku: 'TMB-PLY-302',
    name: 'Phenolic Film Faced Plywood 18mm (1.22x2.44m)',
    category: 'timber',
    current_stock: 14,
    min_stock_level: 40,
    unit: 'pieces',
    location: 'Shed D-02',
    description: 'Waterproof birch core shuttering plywood for smooth concrete finish.'
  },
  {
    id: 'plm-401',
    sku: 'PLM-PVC-401',
    name: 'Rigid PVC Evacuation Pipe Ø110mm (4m)',
    category: 'plumbing',
    current_stock: 92,
    min_stock_level: 40,
    unit: 'meters',
    location: 'Rack E-01',
    description: 'Sanitary wastewater drainage pipe with integrated gasket socket.'
  },
  {
    id: 'plm-402',
    sku: 'PLM-HDP-402',
    name: 'HDPE Water Pressure Pipe PN16 Ø32mm (100m Roll)',
    category: 'plumbing',
    current_stock: 4,
    min_stock_level: 12,
    unit: 'pieces',
    location: 'Rack E-03',
    description: 'High-density polyethylene roll for potable water main supply line.'
  },
  {
    id: 'pnt-501',
    sku: 'PNT-ACR-501',
    name: 'Exterior Acrylic Weatherproof Paint (20kg Bucket)',
    category: 'paints',
    current_stock: 64,
    min_stock_level: 25,
    unit: 'buckets',
    location: 'Store Room F-02',
    description: 'UV-resistant matte facade coating with high water repellency.'
  },
  {
    id: 'ele-601',
    sku: 'ELE-CBL-601',
    name: 'Rigid Copper Cable U1000 R2V 3G2.5mm² (100m)',
    category: 'electrical',
    current_stock: 28,
    min_stock_level: 15,
    unit: 'pieces',
    location: 'Secure Room G-01',
    description: 'Heavy duty insulated power cable for building electrical circuits.'
  }
]

// Fallback initial activity logs for demo/offline resilience
export const INITIAL_LOGS = [
  {
    id: 'log-001',
    item_id: 'cem-001',
    worker_id: 'w-101',
    worker_name: 'Karim Bennani',
    change_type: 'IN',
    quantity: 100,
    notes: 'Supplier Truck #48 - Lafarge Ciments',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'log-002',
    item_id: 'stl-102',
    worker_id: 'w-102',
    worker_name: 'Said Idrissi',
    change_type: 'OUT',
    quantity: 50,
    notes: 'Dispatched to Casa Marina Jobsite',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'log-003',
    item_id: 'brk-202',
    worker_id: 'w-101',
    worker_name: 'Karim Bennani',
    change_type: 'OUT',
    quantity: 120,
    notes: 'Order #902 Villa Anfa',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  }
]
