
// server/config/schemas/Lead.js

export const createLeadsTable = `
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    customer_name VARCHAR(150) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30) NOT NULL,
    address TEXT,
    product_interest VARCHAR(255),
    source VARCHAR(50) DEFAULT 'public_form',
    status VARCHAR(20) DEFAULT 'new'
        CHECK (status IN ('new', 'contacted', 'qualified', 'won', 'lost')),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;
