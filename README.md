# 🚧 Road Scheduler

A visual calendar for scheduling road construction projects with crew management.

## Features

- **Multiple Views**: Toggle between Monthly, Weekly, and Gantt chart views
- **Project Management**: Create, edit, and delete construction projects
- **Crew Management**: 
  - Add/remove crews with custom colors
  - Add members to crews
  - Assign crew leaders
- **Color Coding**: Projects are color-coded by assigned crew
- **Local Storage**: Data persists in browser (backend coming soon)

## Usage

1. Open `index.html` in a browser
2. Click "👥 Crews" to manage your crews and their colors
3. Click "+ New Project" to add construction projects
4. Toggle between Month/Week/Gantt views using the buttons in the header
5. Click on any project block to edit or delete it

## Views

- **Monthly**: Traditional calendar grid showing project blocks spanning days
- **Weekly**: Detailed week view with projects listed per day
- **Gantt**: Timeline view showing project duration bars

## Data

All data is stored in localStorage:
- `roadScheduler_projects` - Project data
- `roadScheduler_crews` - Crew data

## Development

No build process required - pure HTML/CSS/JavaScript.

```bash
# Just open in browser
open index.html
```

## License

MIT
