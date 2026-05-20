-- Enable Realtime for counterparties table so trade-connect events are pushed
-- to the receiving tenant in real-time without requiring an app restart.
ALTER PUBLICATION supabase_realtime ADD TABLE counterparties;;
