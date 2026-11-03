
// server/config/schemas/Invitation.js

export const createInvitationsTable = `
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('manager', 'salesperson')),
    invited_by UUID NOT NULL REFERENCES profiles(id),
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, email)
);
`;
