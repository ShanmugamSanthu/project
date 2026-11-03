export const createActivitiesTable = `
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    activity_type VARCHAR(20) NOT NULL
        CHECK (activity_type IN ('call', 'meeting', 'email', 'note')),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
`;
