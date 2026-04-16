-- Aggiunge flag Dock Alumni ai profili
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_dock_alumni boolean NOT NULL DEFAULT false;
