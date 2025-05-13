// PrivacyPolicy.tsx
import React from "react";
import {
  Box,
  Container,
  Typography,
  Divider,
  CssBaseline,
  Paper,
} from "@mui/material";

const PrivacyPolicy = () => {
  return (
    <>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h3" gutterBottom>
            Privacy Policy
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Section
            title="1. No Personal Data Collection"
            content="We do not collect or process any personal data. We have no way of identifying who you are, and we do not seek to."
          />

          <Section
            title="2. Session Identification"
            content="To group and analyze simulation sessions from the same device, we store a randomly generated User ID in your browser's local storage. This ID:
- Is created randomly by your browser.
- Does not contain any personally identifiable information.
- Is used solely to associate multiple simulation sessions from the same browser for analytics purposes.
- Is not shared with any third parties."
          />

          <Section
            title="3. Local Storage Use"
            content="We store simulation data in your browser’s local storage to:
- Improve performance by caching your simulations.
- Allow your simulations to persist across sessions."
          />

          <Section
            title="4. Database Use"
            content="When you use features that involve sharing or analyzing simulations, simulation data (not personal data) is saved to our database. This allows:
- Sharing simulations via unique links.
- Aggregating anonymous simulation data for statistical or feature improvement purposes."
          />

          <Section
            title="5. No Tracking Across Sites"
            content="We do not track your activity across other websites or services. The data we handle is limited to simulation activity on our own website."
          />

          <Section
            title="6. Third Parties"
            content="We do not share any data with advertisers or unrelated third parties. Any data collected is used internally to improve the service."
          />

          <Section
            title="7. Your Control"
            content="You are in full control of your data:
- You can clear your browser's local storage at any time to remove your user ID and cached simulations.
- If you do not consent we will not generate a User ID for your browser session, persist this ID in your browsers local storage, or write this ID to the database. This will limit your ability to share simulations, but will not affect your ability to use the application.
- If you use a private/incognito browser session, no data will persist between sessions."
          />

          <Divider sx={{ my: 3 }} />

            <Typography variant="body2" color="textSecondary">
                Last updated: May 2025
            </Typography>

        </Paper>
      </Container>
    </>
  );
};

const Section: React.FC<{ title: string; content: string }> = ({
  title,
  content,
}) => {
  const lines = content.split("\n").filter(Boolean);
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      {lines.map((line, i) =>
        line.startsWith("-") ? (
          <Typography key={i} component="li" sx={{ ml: 3 }}>
            {line.replace(/^- /, "")}
          </Typography>
        ) : (
          <Typography key={i} paragraph>
            {line}
          </Typography>
        )
      )}
    </Box>
  );
};

export default PrivacyPolicy;
