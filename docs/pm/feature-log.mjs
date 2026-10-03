/**
 * Source of truth for the PM feature report.
 * Edit this file, then run `npm run docs:pm` to regenerate the .docx.
 *
 * Each feature follows Situation → Actions → Result, plus the decisions taken,
 * open items and how to try it — written for a non-technical reader.
 */
export const report = {
  title: 'Therapist Portal — Feature Report',
  subtitle: 'Ksira Care · Progress updates for Product',
  updated: '3 October 2026',

  features: [
    {
      id: 'F1',
      name: 'Therapist sign-in',
      status: 'Built — real API connection ready, waiting on backend',
      date: '3 October 2026',
      summary:
        'Therapists can sign in to a private portal with the email and password an admin set up for them.',

      situation: [
        'The Ksira Care website was public-only. Therapists had no way to sign in to manage their availability and upcoming sessions.',
        'Accounts must stay under admin control (no public sign-up), the portal must be kept separate from the public website, and the backend APIs are designed but not yet deployed.',
      ],

      actions: [
        {
          title: 'Built a dedicated sign-in page',
          detail:
            'Available at /therapist/login. Follows the provided mockup, adjusted to match the live site’s logo, colours, buttons and form fields so the brand feels consistent.',
        },
        {
          title: 'Kept the portal separate from the public website',
          detail:
            'The portal has no public navigation, footer or welcome popup, is not linked from the public site, and asks search engines not to list it.',
        },
        {
          title: 'Made sign-in secure by design',
          detail:
            'The login session is held in a secure browser cookie that website code cannot read, protecting it from malicious scripts. Error messages never reveal whether an email has an account, and after sign-in therapists can only be sent to pages inside the portal.',
        },
        {
          title: 'Made it easy to use',
          detail:
            'Show/hide password button, support for saved passwords, clear messages for each problem (wrong details, inactive account, too many attempts, no connection), a loading state that prevents double submission, and full keyboard and screen-reader support.',
        },
        {
          title: 'Built against a simulated backend',
          detail:
            'Frontend work did not have to wait for the APIs. Connecting the real backend is a single, contained change once the API details are shared.',
        },
        {
          title: 'Prepared the connection to the real backend',
          detail:
            'The portal is ready to talk to the agreed sign-in, profile and sign-out APIs. Local development keeps using test data; the live site uses the real API as soon as it is deployed.',
        },
        {
          title: 'Handled the 2-hour session limit gracefully',
          detail:
            'When a session runs out, the therapist is taken to the sign-in page with a friendly “Your session has expired” note, and returned to the page they were on after signing in again.',
        },
        {
          title: 'Added automated tests',
          detail:
            'Automated checks cover signing in, error handling, safe redirects and session handling, so future changes can’t silently break login.',
        },
      ],

      result: [
        'Therapists can sign in, land on their dashboard (see F2) and sign out (currently with test accounts).',
        'The public website is unchanged for visitors, and its loading speed is unaffected — portal code only downloads for people who open the portal.',
        'The feature is ready to connect to the real backend as soon as the API details arrive.',
      ],

      decisions: [
        {
          decision: 'No self sign-up — admins create therapist accounts',
          reason: 'Keeps onboarding controlled and vetted.',
        },
        {
          decision: 'No “Forgot password” link',
          reason: 'Admins handle resets. Fewer flows to build and secure; revisit if support requests grow.',
        },
        {
          decision: 'No two-step verification (MFA) for now',
          reason: 'Faster to launch. The design allows adding it later without a rewrite.',
        },
        {
          decision: 'Portal reached by direct link only',
          reason: 'Keeps the therapist area discreet and the public site focused on clients.',
        },
        {
          decision: 'Live site styling wins over the mockup where they differ',
          reason: 'One consistent brand across the public site and the portal.',
        },
        {
          decision: 'Secure cookies instead of storing login details in the browser',
          reason: 'Industry best practice for health-related data.',
        },
        {
          decision: 'Sessions last 2 hours with no automatic renewal (for now)',
          reason: 'Simpler to launch. When a session ends, the therapist is asked to sign in again and returned to the page they were on. Auto-renewal is a later improvement.',
        },
        {
          decision: 'Passwords are sent as typed over HTTPS, not encrypted in the browser',
          reason: 'HTTPS already encrypts them in transit; browser-side encryption adds complexity without real protection. The server stores them securely hashed.',
        },
      ],

      openItems: [
        {
          item: 'Send the session as a secure (httpOnly) cookie instead of in the response body — agreed by backend',
          owner: 'Backend',
          impact: 'Keeps the login session out of reach of malicious scripts.',
        },
        {
          item: 'Build the sign-out endpoint (POST /api/auth/logout) — spec shared',
          owner: 'Backend',
          impact: 'Only the server can clear the secure cookie; without it, “Sign out” would not truly sign the therapist out.',
        },
        {
          item: 'Make the profile endpoint identify the therapist from the session (GET /api/profile, no ID in the URL) and include the name',
          owner: 'Backend',
          impact: 'Lets the portal remember a signed-in therapist across page refreshes, and prevents one therapist viewing another’s profile.',
        },
        {
          item: 'Store passwords with Argon2id or bcrypt, return the same error for unknown email and wrong password, and limit repeated failed sign-ins',
          owner: 'Backend',
          impact: 'Core security protections live on the server.',
        },
        {
          item: 'Use the agreed error format (standard “Problem Details” with a code such as INVALID_CREDENTIALS)',
          owner: 'Backend',
          impact: 'Lets the portal show the right message for each problem.',
        },
        {
          item: 'Serve the API from ksiracare.com/api (preferred) or api.ksiracare.com — not ksira-care.com',
          owner: 'Backend / DevOps',
          impact: 'Blocker: the website is on ksiracare.com. If the API stays on ksira-care.com, Safari (all iPhones and Macs) blocks the login cookie and therapists cannot sign in. The server itself can stay where it is; only its public address changes.',
        },
      ],

      demo: [
        'Run the app locally and open /therapist/login.',
        'Sign in with therapist@ksiracare.com / password123 to reach the portal.',
        'Try disabled@ksiracare.com / password123 to see the inactive-account message.',
        'Enter a wrong password five times in a row to see the “too many attempts” message.',
      ],
    },

    {
      id: 'F2',
      name: 'Therapist dashboard',
      status: 'Built — real API connection ready, waiting on backend',
      date: '3 October 2026',
      summary:
        'After signing in, therapists see their next session, today’s schedule and their totals — all on one screen.',

      situation: [
        'Once signed in, therapists need a home screen that answers “how am I doing and what’s coming up?” without digging through pages.',
        'The design showed four summary cards and five navigation tabs. The payout card was dropped by Product, and the other sections (Availability, Bookings, Profile, Payouts) are not built yet.',
      ],

      actions: [
        {
          title: 'Built the portal frame shared by every signed-in page',
          detail:
            'A header with the Ksira Care logo, navigation and an account menu. It stays visible while scrolling and adapts to phone screens.',
        },
        {
          title: 'Added an account menu',
          detail:
            'The therapist’s initials open a small menu showing their full name and email (so it’s clear which account is signed in) and a Sign out option. It works fully with the keyboard and screen readers, and leaves room for a Profile link later.',
        },
        {
          title: 'Built the dashboard',
          detail:
            'A time-of-day greeting (“Good morning, Aanya.”) and today’s date. On desktop the next session and the totals sit on the left with today’s timeline running down the right, so neither side leaves an empty gap; on phones they stack in order of urgency: next session, today, totals.',
        },
        {
          title: 'Put the next session first',
          detail:
            'A highlighted card shows who is next, a countdown (“In 25 min”) rather than just a clock time, what the client is hoping for, and their languages. During a session it switches to “In session”. If today is done, it shows the next session in the coming two weeks.',
        },
        {
          title: 'Showed today as a short timeline',
          detail:
            'Finished sessions are ticked and faded, the current one is highlighted, and the rest are listed in order — so the therapist sees where they are in their day at a glance. When the last session ends it says “You’re done for today 🌿” with the number completed.',
        },
        {
          title: 'Kept the Today list a predictable size on busy days',
          detail:
            'Finished sessions fold into one line (“✓ 4 done earlier · Show”) that can be expanded. Only the current session and the next four are listed; anything later shows as “+ 2 more later today · View in Bookings”. With 3 sessions or 12, the list never needs its own scroll bar.',
        },
        {
          title: 'Kept every date and time in IST',
          detail:
            'The greeting, date and monthly figures follow Indian Standard Time even if the therapist’s device is set to another timezone, so schedules always line up with clients.',
        },
        {
          title: 'Designed for slow or failed connections',
          detail:
            'Placeholder cards show while numbers load, and if loading fails the therapist sees a clear message with a “Try again” button instead of a broken page.',
        },
        {
          title: 'Built against simulated data',
          detail:
            'As with sign-in, the dashboard runs on test numbers until its API is ready; connecting the real data is a single, contained change.',
        },
      ],

      result: [
        'Signed-in therapists can answer “what’s next and am I ready?” within seconds, without scrolling.',
        'Countdowns and the “now” marker update on their own while the page is open.',
        'The portal frame is in place, so future sections (Availability, Bookings, Profile) only need their own page plus one navigation entry.',
        'Screen-reader users hear each number together with its label, and the page works with the keyboard alone.',
      ],

      decisions: [
        {
          decision: 'Payout card removed',
          reason: 'Product decision.',
        },
        {
          decision: 'Navigation only shows sections that are built (Dashboard for now)',
          reason: 'Tabs that lead nowhere frustrate users; each tab appears when its page ships.',
        },
        {
          decision: 'Sign out moved into an account menu instead of a link always on screen',
          reason: 'Prevents accidental sign-outs, shows which account is signed in, saves space on phones, and gives the future Profile page a natural home. This is the pattern people already know from Google, Slack and similar tools.',
        },
        {
          decision: 'Header shows only initials, not the therapist’s name',
          reason: 'The greeting already uses her name; repeating it in the header felt crowded. The full name appears inside the account menu, where it confirms the account.',
        },
        {
          decision: 'First card reads “Completed this month · October 2026”',
          reason: 'The design said “Sessions this month” and “Completed in June”, which repeats itself in two slightly different ways. One clear label plus the month is easier to scan.',
        },
        {
          decision: 'Card numbers use the site’s rounded sans-serif font',
          reason: 'In the serif font some digits dip below the line (e.g. 3, 4), which looks uneven in large numbers. Headings stay serif.',
        },
        {
          decision: '“Sign out” instead of “Log out”',
          reason: 'Matches “Sign in” on the login page — consistent wording throughout.',
        },
        {
          decision: 'Dashboard redesigned around “what’s next” instead of a full bookings table',
          reason: 'A month of bookings (40+ rows) made the dashboard long and pushed the important information down; a scrolling box inside the page would hide rows and trap scrolling. The dashboard now answers “what’s next?”; the full list moved to its own Bookings page (F3).',
        },
        {
          decision: 'Busy days: finished sessions fold away and the list is capped at the next four, instead of a scrolling box',
          reason: 'A scroll area inside a card hides rows and fights with page scrolling. Folding and capping keeps what matters now in view and the page short on phones.',
        },
        {
          decision: 'The “Today” number card was removed',
          reason: 'The Today timeline shows the same count with names and times, so the card repeated it.',
        },
        {
          decision: 'Countdown (“In 25 min”) instead of only a clock time',
          reason: 'Removes mental maths right before a session.',
        },
        {
          decision: '“You’re done for today” message at the end of the day',
          reason: 'Therapy is draining work; a clear, positive end to the day is better than an empty list.',
        },
        {
          decision: 'All times shown in IST',
          reason: 'One shared clock for therapists, clients and admins avoids scheduling mix-ups.',
        },
        {
          decision: 'Live site styling wins over the mockup where they differ',
          reason: 'Same logo, fonts and colours as the public site.',
        },
      ],

      openItems: [
        {
          item: 'Build the dashboard summary endpoint (GET /api/therapists/me/dashboard-summary) — revised spec shared; must use “me” (from the session), not a therapist ID in the URL',
          owner: 'Backend',
          impact: 'Needed to show real figures. An ID in the URL breaks on page refresh and would let therapists see each other’s numbers.',
        },
        {
          item: 'Dashboard summary only needs completedThisMonth, completedAllTime and (optionally) activeSince — the “today” count is no longer used',
          owner: 'Backend',
          impact: 'Simpler endpoint. activeSince shows “Since Jan 2025” under the all-time total; without it the card says “Across all your sessions”.',
        },
      ],

      demo: [
        'Sign in at /therapist/login with therapist@ksiracare.com / password123.',
        'You land on the dashboard: the greeting, your next session with a countdown, today’s timeline and your totals. Test data has a busy day (10 sessions) so you can see finished sessions fold away and “+ N more later today”.',
        'Use Sign out (top right) to return to the login page.',
      ],
    },
    {
      id: 'F3',
      name: 'Bookings — marking sessions',
      status: 'Built — real API connection ready, waiting on backend',
      date: '3 October 2026',
      summary:
        'Therapists mark each session as complete or “client didn’t join”, from a list of today’s sessions plus anything they forgot to mark.',

      situation: [
        'Every session has to be closed off by the therapist — marked complete, or recorded as a client no-show — so sessions are counted correctly (and, later, paid).',
        'The design showed one card per booking with a “Mark complete” button, assignment and reschedule details, and Upcoming / Completed tabs. Product chose “Today” for the first tab (to match the dashboard) and asked for a way to record no-shows; country was dropped.',
      ],

      actions: [
        {
          title: 'One card per session',
          detail:
            'A date block, the time with a countdown (“in 25 min”) or how long ago it ended, the client (name shortened for privacy), their languages, “assigned by admin on …”, and what the client expects. If an admin moved the session, a “Rescheduled by admin” badge shows when it was moved from and why.',
        },
        {
          title: 'Mark complete / Client didn’t join',
          detail:
            'Both buttons appear once the session has started; before that the card simply says “You can mark this from 15:30” — no greyed-out buttons. Marking takes one tap, the card moves to Completed, and a message offers Undo for a few seconds in case of a mis-tap.',
        },
        {
          title: 'Nothing gets forgotten',
          detail:
            'Any earlier session that was never marked stays at the top of the Today tab with an amber “Needs marking” label and a summary line (“3 past sessions need marking”), until it is dealt with.',
        },
        {
          title: 'Completed tab',
          detail:
            'Marked sessions from the current month, newest first, each with its outcome: Completed, Client didn’t join, or Therapist no-show (recorded by admin). Sessions marked today show an Undo button until midnight.',
        },
        {
          title: 'Practical details once, not on every card',
          detail:
            '“Your coordinator emails the Google Meet link to you and the client before each session” is shown once at the top of the page.',
        },
        {
          title: 'Reliable and accessible',
          detail:
            'If marking fails, the card stays put with a clear “Couldn’t update — please try again”. Works on phones, with the keyboard, and announces marks and undos to screen readers.',
        },
      ],

      result: [
        'Therapists can close off each session in one tap, with a safety net for mistakes.',
        'Unmarked sessions can’t quietly slip away, which keeps session counts — and later payouts — accurate.',
        'The dashboard shows the same states (“Needs marking”, “Client didn’t join”), so the portal speaks one language.',
      ],

      decisions: [
        {
          decision: 'Tabs are “Today” and “Completed”',
          reason: 'Product decision; “Today” matches the dashboard. Upcoming days are planned on the Availability page.',
        },
        {
          decision: 'Forgotten sessions stay on the Today tab until marked',
          reason: 'With a today-only list, yesterday’s unmarked session would otherwise disappear and never be counted.',
        },
        {
          decision: 'Added “Client didn’t join”',
          reason: 'Product decision. Without it, a no-show session has no correct way to be closed.',
        },
        {
          decision: 'Undo instead of a confirmation pop-up — available until midnight on the day of marking',
          reason: 'Marking is frequent and usually right; Undo fixes the rare mistake without slowing every mark down. Product chose end of day as the limit (Q1).',
        },
        {
          decision: 'No buttons until a session starts',
          reason: 'Rows of greyed-out buttons are noise and invite pointless clicks; a short “You can mark this from …” is clearer.',
        },
        {
          decision: 'Country removed; Completed shows the whole current month',
          reason: 'Product decisions (Q7). Matches the dashboard’s “Completed this month”.',
        },
        {
          decision: 'Therapist no-shows are recorded by admin only',
          reason: 'Product decision (Q5); therapists see them as a status under Completed.',
        },
      ],

      openItems: [
        {
          item: 'New endpoint to mark a session: PATCH /api/bookings/{bookingId} with { bookingStatus: COMPLETED | CLIENT_NO_SHOW | PENDING } (PENDING = undo)',
          owner: 'Backend',
          impact: 'Needed for Mark complete, Client didn’t join and Undo to work for real. Only the therapist’s own bookings, only once the session has started; undo (PENDING) only on the same day (IST) the mark was made; therapists can never set THERAPIST_NO_SHOW.',
        },
        {
          item: 'Add to the bookings response: assignedAt, rescheduledFrom, rescheduleNote, markedAt',
          owner: 'Backend',
          impact: 'Shows “assigned by admin on …”, reschedule details, and whether a mark can still be undone today; each is hidden until the field is provided.',
        },
        {
          item: 'Bookings API: serve at ksiracare.com/api/bookings, scoped to the signed-in therapist; confirm epoch milliseconds; underscores in statuses',
          owner: 'Backend',
          impact: 'Same domain and security points as sign-in.',
        },
      ],

      demo: [
        'Sign in, then open the “Bookings” tab.',
        'At the top: sessions from yesterday and earlier today that still need marking, with an amber edge.',
        'Tap “Mark complete” on one — it moves to Completed and “Undo” appears at the bottom; try Undo.',
        'Later sessions show “You can mark this from …” instead of buttons.',
        'Open “Completed” to see this month with outcomes; today’s marks have an Undo button until midnight.',
      ],
    },
    {
      id: 'F4',
      name: 'Availability',
      status: 'Built — real API connection ready, waiting on backend',
      date: '3 October 2026',
      summary:
        'Therapists choose which hours clients can book, up to 60 days ahead, and save all their changes in one go.',

      situation: [
        'Clients can only book hours a therapist has opened, so therapists need a quick, reliable way to open and close hours across the coming weeks.',
        'The design showed a month calendar, an hour grid for the chosen day, a Save button at the top and a “This week” summary strip.',
      ],

      actions: [
        {
          title: 'Built the calendar + hour grid',
          detail:
            'Pick a day on the calendar (today to 60 days ahead), then tap hours from 09:00 to 23:00 to open or close them. Shaded days have open hours and a dot marks days with a booked session. Arrow keys move around the calendar.',
        },
        {
          title: 'A save bar that can’t be missed',
          detail:
            'Changes can span many days. A bar slides up at the bottom — “3 unsaved changes across 2 days · Discard · Save changes” — and days and hours with unsaved edits are marked. After saving: “Saved. Your open hours are live.”',
        },
        {
          title: 'Protected against lost work',
          detail:
            'Leaving the page (or closing the tab) with unsaved changes asks for confirmation first.',
        },
        {
          title: 'Open all / Close all for a day',
          detail:
            'Opens or closes every free hour on the chosen day in one tap, instead of 15 separate taps.',
        },
        {
          title: 'Locked what shouldn’t change',
          detail:
            'Hours with a session booked are shown but locked, and hours that have already started today can’t be changed. If an hour is booked while the therapist is editing, saving explains this and keeps the rest of their changes.',
        },
        {
          title: 'A gentle nudge',
          detail:
            'If nothing is open in the next 7 days, the page says so — “clients can’t book you yet” — prompting the therapist to open some hours.',
        },
      ],

      result: [
        'Therapists can set their availability for the next two months quickly, on desktop or phone.',
        'Edits are never lost by accident, and booked sessions can never be cancelled from this page.',
        'Ready to switch to the real slots API once it is deployed.',
      ],

      decisions: [
        {
          decision: 'Save bar at the bottom instead of a Save button at the top',
          reason: 'A top button is easy to miss after editing several days and offers no way to undo. The bar appears only when needed, shows what will change, and offers Discard.',
        },
        {
          decision: '“This week” strip replaced by a single nudge line',
          reason: 'The strip repeated what the calendar shading already shows; its useful part was the warning about unopened days, which is kept.',
        },
        {
          decision: 'Added Open all / Close all',
          reason: 'Opening hours one by one for 60 days is tedious; this removes most of the taps.',
        },
        {
          decision: 'Hours that have already started can’t be opened',
          reason: 'A client could never book them, so allowing it would only mislead.',
        },
        {
          decision: 'Navigation is now Dashboard · Availability · Bookings',
          reason: 'Matches the design’s order; tabs appear as their pages ship.',
        },
      ],

      openItems: [
        {
          item: 'Slots API: use the session to identify the therapist (e.g. /api/therapists/me/slots) instead of ?therapistId= in the URL',
          owner: 'Backend',
          impact: 'Otherwise a therapist could read or change another therapist’s availability by editing the URL.',
        },
        {
          item: 'Confirm: does GET return every hour, or only hours with a record? Does POST update only the hours sent, or replace the whole range?',
          owner: 'Backend',
          impact: 'The portal sends only changed hours. If POST replaces the range, unsent hours could be wiped.',
        },
        {
          item: 'Reject changes to booked hours with a 409 Conflict',
          owner: 'Backend',
          impact: 'Prevents a booked session being cancelled if it was booked while the therapist was editing; the portal already explains this to the therapist.',
        },
        {
          item: 'Fix the status spelling THERAPIST_UNVAILABLE → THERAPIST_UNAVAILABLE; confirm time is epoch milliseconds',
          owner: 'Backend',
          impact: 'The portal accepts both spellings for now.',
        },
      ],

      demo: [
        'Sign in, then open the “Availability” tab.',
        'Pick a day on the calendar and tap a few hours: an amber dot marks unsaved hours and a save bar appears.',
        'Try “Open all”, then “Discard”; then make a change and “Save changes”.',
        'Try leaving the page with unsaved changes to see the confirmation.',
      ],
    },
    {
      id: 'F5',
      name: 'Profile',
      status: 'Built — real API connection ready, waiting on backend',
      date: '3 October 2026',
      summary:
        'Therapists can see the personal details Ksira Care holds about them: name, email, phone, date of birth, languages and address.',

      situation: [
        'Therapists need to check that the details Ksira Care holds are correct — especially contact details and the languages clients are matched on.',
        'The design showed name, display name, email, phone, date of birth, languages and address, with a note that name and email changes need coordinator approval. Product dropped the display name. There is no API yet for changing details, and which fields therapists may edit is still to be decided.',
      ],

      actions: [
        {
          title: 'Built the profile page',
          detail:
            'Full name, email, phone, date of birth, languages and address, in the same calm card style as the rest of the portal. Missing details say “Not provided” rather than leaving a blank.',
        },
        {
          title: 'Phone number hidden by default',
          detail:
            'Shown as “+91 98••• ••210” with a Show button, so a glance at the screen doesn’t reveal it — as in the design.',
        },
        {
          title: 'Easy to reach',
          detail:
            'A “Profile” tab in the navigation, plus “Your profile” in the account menu (top right), above Sign out.',
        },
        {
          title: 'One profile source for the whole portal',
          detail:
            'The name in the greeting and account menu now comes from the same profile API as this page, so it can never disagree.',
        },
      ],

      result: [
        'Therapists can check their details at any time.',
        'For any change, the page tells them to contact their coordinator.',
      ],

      decisions: [
        {
          decision: 'Display name removed',
          reason: 'Product decision.',
        },
        {
          decision: 'Read-only',
          reason: 'Product decision (Q2): therapists can’t change their profile; the coordinator handles changes.',
        },
        {
          decision: 'Phone masked until “Show” is pressed',
          reason: 'Matches the design; protects the number on shared or visible screens.',
        },
      ],

      openItems: [
        {
          item: 'Profile API: GET /api/therapists/me (from the session, no id in the URL) with firstName, middleName, lastName, email, phone (E.164), dateOfBirth (YYYY-MM-DD), languages (ISO codes) and a structured address',
          owner: 'Backend',
          impact: 'Feeds this page and the name shown across the portal. Date of birth is new; it wasn’t in the first API draft.',
        },
      ],

      demo: [
        'Sign in, then open the “Profile” tab (or “Your profile” in the account menu).',
        'Press “Show” next to the phone number to reveal it.',
      ],
    },
  ],

  /** Open questions for the PM, collected as we build. */
  questions: [
    {
      id: 'Q1',
      question:
        'After a therapist marks a session (complete or client didn’t join), how long should they be able to undo it?',
      context:
        'The portal offers Undo for a few seconds after marking. The server also needs a limit (for example, 10 minutes after marking, or until the end of the day); otherwise a session could be reverted long after the fact — for instance after payouts have been calculated.',
      raisedIn: 'F3 · Bookings',
      raisedOn: '3 October 2026',
      answer: 'Until the end of the day (IST) on which the session was marked.',
      answeredOn: '3 October 2026',
    },
    {
      id: 'Q2',
      question:
        'Can therapists change their own profile details in the portal? If so, which fields — and which need coordinator approval before they take effect?',
      context:
        'The design suggests name and email changes need approval, which implies other fields (phone, languages, address) could be changed directly. Today the page is read-only and asks therapists to contact their coordinator. The answer decides whether we build an edit form and an approval flow.',
      raisedIn: 'F5 · Profile',
      raisedOn: '3 October 2026',
      answer: 'No — therapists can’t change their profile. The page stays read-only.',
      answeredOn: '3 October 2026',
    },
    {
      id: 'Q3',
      question:
        'How are therapist accounts created and passwords reset — who does it, how does a therapist receive their first password, and who do they contact when locked out?',
      context:
        'There is no self sign-up or “Forgot password” by design, so this process is the only way in. The sign-in page currently says “Contact your coordinator for access”.',
      raisedIn: 'F1 · Sign-in',
      raisedOn: '3 October 2026',
      answer: 'Admin adds therapists directly to the database; there is nothing for therapists to do in the portal.',
      answeredOn: '3 October 2026',
    },
    {
      id: 'Q4',
      question: 'Is Payouts still in scope for the therapist portal? If so, what should therapists see?',
      context:
        'The original design had a Payouts tab and a payout card; the card was removed and no Payouts design exists yet. Fees are also not in the bookings API.',
      raisedIn: 'F2 · Dashboard',
      raisedOn: '3 October 2026',
      answer: 'No — Payouts is out of scope.',
      answeredOn: '3 October 2026',
    },
    {
      id: 'Q5',
      question:
        'Who records a “therapist no-show” — the admin only? And should therapists be told when one is recorded against them?',
      context:
        'Therapists can mark sessions “Complete” or “Client didn’t join”, but not that they themselves missed a session. The status exists in the API and is shown in their history.',
      raisedIn: 'F3 · Bookings',
      raisedOn: '3 October 2026',
      answer: 'Admin records therapist no-shows. Therapists see it as the status on that booking (under Completed).',
      answeredOn: '3 October 2026',
    },
    {
      id: 'Q6',
      question:
        'What should happen to a session the therapist never marks? For example, remind them, flag it to the coordinator after a few days, or close it automatically?',
      context:
        'Unmarked sessions stay at the top of the Bookings page for up to 30 days. After that they drop off the therapist’s view, which could leave sessions uncounted.',
      raisedIn: 'F3 · Bookings',
      raisedOn: '3 October 2026',
      answer: 'Leave it as is: an unmarked session stays in the list as “Needs marking”.',
      answeredOn: '3 October 2026',
    },
    {
      id: 'Q7',
      question: 'Do therapists need to see completed sessions older than 30 days?',
      context:
        'The Completed tab currently shows the last 30 days. Longer history would need paging or a month picker.',
      raisedIn: 'F3 · Bookings',
      raisedOn: '3 October 2026',
      answer: 'Show completed sessions for the entire current month.',
      answeredOn: '3 October 2026',
    },
    {
      id: 'Q8',
      question:
        'Should therapists be able to repeat a weekly pattern (e.g. “copy Monday’s hours to every Monday”) on the Availability page? How high a priority is it?',
      context:
        'Today hours are opened day by day (with Open all / Close all per day). A repeat option would make setting up the 60-day window much faster.',
      raisedIn: 'F4 · Availability',
      raisedOn: '3 October 2026',
      answer: 'No — leave Availability as it is.',
      answeredOn: '3 October 2026',
    },
  ],

  changelog: [
    {
      date: '3 October 2026',
      entry: 'F1 Therapist sign-in built on test data; portal separated from the public site.',
    },
    {
      date: '3 October 2026',
      entry: 'F1 API contract agreed in principle: secure cookie session, sign-out endpoint, profile endpoint provides the name; 2-hour sessions with no auto-refresh for now.',
    },
    {
      date: '3 October 2026',
      entry: 'F2 Therapist dashboard and shared portal frame built on test data; payout card removed.',
    },
    {
      date: '3 October 2026',
      entry: 'Real API connection built for sign-in, profile, sign-out and dashboard (switched on once the backend is live). Session-expiry handling added. Flagged API domain as a blocker: must be on ksiracare.com.',
    },
    {
      date: '3 October 2026',
      entry: 'F2 UX refinements: account menu replaces the always-visible Sign out link; first card relabelled “Completed this month”; card numbers switched to the sans-serif font.',
    },
    {
      date: '3 October 2026',
      entry: 'F2: name removed from the header (initials only) so it isn’t repeated on the page.',
    },
    {
      date: '3 October 2026',
      entry: 'F2: second card renamed from “Upcoming” to “Today · Sessions still to come”; dashboard API spec revised (me-based path, clear field definitions, optional start date).',
    },
    {
      date: '3 October 2026',
      entry: 'F3 Bookings table built on test data: Today and This month tabs, statuses, languages, phone layout.',
    },
    {
      date: '3 October 2026',
      entry: 'Dashboard redesigned around “what’s next”: next-session card with countdown, today’s timeline, slim totals. Full bookings list moved to a new Bookings page (F3) with day groups and Upcoming / Past / All filters.',
    },
    {
      date: '3 October 2026',
      entry: 'F2: Today list handles busy days — finished sessions fold into one expandable line, only the next four are listed with a link to the rest; next-session card no longer stretches.',
    },
    {
      date: '3 October 2026',
      entry: 'F3: Past filter removed; Upcoming now shows only today’s remaining sessions. Test data switched to a busy 10-session day for demos.',
    },
    {
      date: '3 October 2026',
      entry: 'F3: “Upcoming” filter renamed to “Today” to match the dashboard.',
    },
    {
      date: '3 October 2026',
      entry: 'F2: totals moved under the next-session card so the dashboard has no empty gap. F3: removed the repeated “Today” day heading on the Today filter.',
    },
    {
      date: '3 October 2026',
      entry: 'F4 Availability built on test data: calendar + hour grid, save bar with discard, unsaved-changes protection, Open all / Close all, locked booked and past hours.',
    },
    {
      date: '3 October 2026',
      entry: 'F3 reworked: Bookings is now where sessions are marked — Mark complete / Client didn’t join with Undo, forgotten sessions pinned as “Needs marking”, Completed tab for the last 30 days, assignment and reschedule details.',
    },
    {
      date: '3 October 2026',
      entry: 'F5 Profile built (read-only): name, email, masked phone, date of birth, languages, address; linked from the nav and account menu. Q2 added on profile editing.',
    },
    {
      date: '3 October 2026',
      entry: 'Frontend quality pass: test data and demo accounts no longer included in the live site’s code; shared colours, loading and error states unified across the portal; unused code removed. Product questions gathered under “Questions for Product”.',
    },
    {
      date: '3 October 2026',
      entry: 'Product answered Q1–Q8. Changes: Undo on today’s marks until midnight; Completed tab shows the whole current month. Profile confirmed read-only; Payouts and weekly repeat out of scope.',
    },
  ],
};
