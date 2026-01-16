# Getting Started with the Adaptive Mastery Learning System

**Time to complete:** 30 minutes
**Difficulty:** Beginner
**Prerequisites:** Node.js 18+ installed

By the end of this tutorial, you will have:
- Installed and launched the application
- Created your first concept with a definition
- Completed your first review session
- Seen your mastery scores update in real-time

---

## Step 1: Install the Application

Open your terminal and navigate to the project directory.

```bash
cd /path/to/FlashCards
```

Install all dependencies:

```bash
npm install
```

**Expected output:**

```
added XXX packages in Xs
```

You should see packages being installed without errors. If you encounter permission errors, try running with `sudo` or fix your npm permissions.

---

## Step 2: Launch the Development Server

Start the Electron application in development mode:

```bash
npm run dev
```

**Expected output:**

```
  VITE v6.x.x  ready in XXX ms

  ->  Local:   http://localhost:5173/
  ->  Network: use --host to expose
```

A desktop window will automatically open showing the Dashboard page.

![Screenshot placeholder: Dashboard showing "0 Cards Due", "0 Total Concepts", and "0% Overall Mastery"](./images/dashboard-empty.png)

**Verification checkpoint:** You should see:
- A navigation sidebar with Dashboard, Review, Concepts, and Settings links
- A "Dashboard" header
- Quick stats showing "0 Cards Due", "0 Total Concepts", "0% Overall Mastery"
- An empty "Mastery by Dimension" section

---

## Step 3: Navigate to the Concepts Page

Click **Concepts** in the left sidebar navigation.

![Screenshot placeholder: Empty Concepts page with "No Concepts Yet" message](./images/concepts-empty.png)

**Verification checkpoint:** You should see:
- A header that says "Concepts"
- A subtitle: "Manage your learning concepts and question banks"
- An "Add Concept" button in the top right
- An empty state message: "No Concepts Yet"

---

## Step 4: Create Your First Concept

Click the **Add Concept** button.

A modal dialog will appear with a form.

![Screenshot placeholder: Create Concept modal form](./images/concept-form.png)

Enter the following information:

| Field | Value |
|-------|-------|
| **Name** | `Photosynthesis` |
| **Definition** | `The process by which plants convert light energy, water, and carbon dioxide into glucose and oxygen` |

Click **Create**.

**Verification checkpoint:** The modal closes and you see your new concept card:
- Card showing "Photosynthesis" as the title
- The definition text below the title
- A "Created" date showing today's date

---

## Step 5: Create Card Variants for Your Concept

Your concept needs card variants before you can review it. The system uses six cognitive dimensions to test your knowledge in different ways.

For this tutorial, we will create a simple definition variant.

Currently, the application auto-generates a basic definition card when you create a concept. Let's verify this exists by checking the dashboard.

Click **Dashboard** in the sidebar.

**Verification checkpoint:** The dashboard now shows:
- "1 Cards Due" (or similar count)
- "1 Total Concepts"
- A "Start Review Session" button should now be visible

---

## Step 6: Start Your First Review Session

Click the **Start Review Session** button.

![Screenshot placeholder: Review page showing a flashcard question](./images/review-question.png)

You will see the Review page with:
- A progress indicator showing "0 reviewed, 1 remaining"
- A card displaying your concept name ("Photosynthesis") and dimension type ("definition")
- A question section with the front of the card
- A **Show Answer** button

---

## Step 7: Answer Your First Card

Read the question on the card.

Click **Show Answer** (or press the **Spacebar** on your keyboard).

![Screenshot placeholder: Review page showing the answer and rating buttons](./images/review-answer.png)

**Verification checkpoint:** You now see:
- The answer section with the definition
- Four rating buttons: **Again**, **Hard**, **Good**, **Easy**
- Keyboard hints showing numbers 1-4 for quick rating

---

## Step 8: Rate Your Response

Rate how well you remembered the answer by clicking one of the buttons:

| Rating | When to Use | Keyboard |
|--------|-------------|----------|
| **Again** | Forgot completely, need to see again soon | 1 |
| **Hard** | Remembered with difficulty | 2 |
| **Good** | Remembered correctly with some effort | 3 |
| **Easy** | Knew it instantly | 4 |

For this tutorial, click **Good** (or press **3**).

**What happens next:**
- The system records your response time and rating
- Your mastery score for the "definition" dimension updates
- The SRS algorithm schedules when to show this card again
- The next due card loads (or you see "No Cards Due" if finished)

---

## Step 9: Complete the Review Session

If there are more cards, continue rating them.

When all cards are reviewed, you will see:

![Screenshot placeholder: Review complete empty state](./images/review-complete.png)

**Verification checkpoint:**
- Message: "No Cards Due for Review"
- "Great job! You have completed all your reviews for now."
- Links to return to Dashboard or add new concepts

Click **Back to Dashboard**.

---

## Step 10: View Your Updated Mastery Profile

On the Dashboard, scroll to the **Mastery by Dimension** section.

![Screenshot placeholder: Dashboard showing mastery bars with one dimension populated](./images/dashboard-mastery.png)

**Verification checkpoint:** You now see:
- A bar for "Definition" dimension showing a percentage (likely 70% if you rated "Good")
- The review count showing "1 reviews"
- Overall Mastery percentage updated from 0%

---

## Congratulations!

You have successfully completed your first learning cycle:

1. Created a concept with a definition
2. Reviewed the card and rated your recall
3. Observed your mastery scores update

**What you learned:**
- How to navigate the application
- How to create concepts
- How the review session flow works
- How ratings affect your mastery profile

---

## Next Steps

| Tutorial | Description |
|----------|-------------|
| [Understanding Your Mastery Profile](./understanding-mastery.md) | Learn to interpret dimension bars, identify weaknesses, and practice targeted review |
| Add Multiple Concepts | Create 5-10 concepts to experience the adaptive card selection |
| Explore Question Types | See how different dimensions test your knowledge differently |

---

## Troubleshooting

### Application won't start

**Problem:** `npm run dev` shows errors.

**Solution:** Ensure you have Node.js 18 or higher:
```bash
node --version
# Should show v18.x.x or higher
```

If needed, update Node.js from [nodejs.org](https://nodejs.org/).

### "API not available" error

**Problem:** The app shows "API not available" when trying to create concepts.

**Solution:** This usually means the Electron preload script failed. Try:
1. Stop the dev server (Ctrl+C)
2. Delete the `out/` directory: `rm -rf out/`
3. Restart: `npm run dev`

### No cards appear for review

**Problem:** Dashboard shows "0 Cards Due" even after creating concepts.

**Solution:** The system automatically creates a definition card when you create a concept. If no cards appear:
1. Check that your concept was saved (appears in Concepts page)
2. The card may be scheduled for later if you rated it "Easy" previously
3. Try creating a new concept to generate a fresh card

---

## Quick Reference

| Action | Keyboard Shortcut |
|--------|-------------------|
| Show Answer | Spacebar |
| Rate "Again" | 1 |
| Rate "Hard" | 2 |
| Rate "Good" | 3 |
| Rate "Easy" | 4 |

| Navigation | Location |
|------------|----------|
| Dashboard | Sidebar -> Dashboard |
| Start Review | Dashboard -> "Start Review Session" |
| Add Concept | Concepts page -> "Add Concept" button |
| View Mastery | Dashboard -> "Mastery by Dimension" section |
