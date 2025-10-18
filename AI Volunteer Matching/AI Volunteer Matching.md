*AirTable* 
Prompt: That is an excellent idea and a much faster way to build the structure! Airtable's AI can often generate a complex base structure from a single, detailed prompt.

Here is a very detailed and specific prompt that covers all the tables and the crucial relationships we've discussed:

✍️ AI Prompt to Build the Base Structure
Copy and paste this entire prompt into the "Tell me what you want to build..." box when creating a new base in Airtable:

"Create a base called 'Solidarity Gardens Volunteer Matcher' with 5 linked tables. The goal is to match volunteers to gardening opportunities based on skills and availability.

1. 'Volunteer Profiles': Main table for people. Fields must include: 'Full Name' (Primary Field), 'Email', 'Phone Number', a 'Status' single select with options like 'Active' and 'Onboarded', a 'Skills' multiple select with common gardening skills, a link field to 'Gardens' (Preferred Gardens), a link field to 'Availability Schedule', and a Count field named 'Matches Count' that counts records linked from the 'Sign Ups' table.

2. 'Gardens': List of locations. Fields must include: 'Garden Name' (Primary Field), 'Address', and a link field to 'Volunteer Profiles'.

3. 'Availability Schedule': Stores general availability. Fields must include: 'Volunteer' (link to 'Volunteer Profiles'), 'Day of Week' (single select for days), 'Time of Day' (single select for 'Mornings', 'Afternoons', 'Evenings').

4. 'Garden Opportunities': Specific shifts/tasks. Fields must include: 'Project Name' (Primary Field), a link field to 'Gardens' (Location), 'Date & Time', 'Required Skills' (multiple select, must mirror 'Volunteer Profiles' skills), 'Volunteer Goal' (number), and a Rollup field named 'Sign-Up Count' that rolls up from the 'Sign Ups' link field using the formula COUNTALL(values).

5. 'Sign Ups': The junction table. The Primary Field must be a Formula field named 'MatchID' that combines the volunteer and opportunity names. Fields must include a link field to 'Volunteer Profiles' (Volunteer) and a link field to 'Garden Opportunities' (Opportunity), a 'Status' single select with options like 'Confirmed' and 'Completed', and a 'Hours Logged' number field. Ensure all linking fields allow linking to multiple records where appropriate.
