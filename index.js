// TASK: import helper functions from utils
// TASK: import initialData

import {getTasks, createNewTask, putTask, deleteTask, patchTask, saveTasks} from './utils/taskFunctions.js';
import {initialData} from './initialData.js';



/*************************************************************************************************************************************************
 * FIX BUGS!!!
 * **********************************************************************************************************************************************/

// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() { //function contains the code that checks for existing data in local storage and loads initial data if necessary.
  if (!localStorage.getItem('tasks')) { //if no data is found under the key tasks, condition is true and code inside if statement is executed
    localStorage.setItem('tasks', JSON.stringify(initialData)); //adds a new item to local storage. sets value associated with key 'tasks' in local storage; converts initialData object into a JSON string => local storages can only store strings.
    localStorage.setItem('showSideBar', 'true') // adds another item to local storage; sets value associated with the key showSideBar to true, 
  } else {
    console.log('Data already exists in localStorage');
  }
}

initializeData();

//NOTES:
//'tasks' is a string literal used as a key to store and retrieve data in local storage. it is a lael or identifier for the data being stored

// TASK: Get elements from the DOM
const elements = {
headerBoardName: document.getElementById('header-board-name'),
columnDivs: document.querySelectorAll('.column-div'),
editTaskModal: document.querySelector('.edit-task-modal-window'),
newTaskModal: document.getElementById('new-task-modal-window'), //fixed typo error, newTaskModel to newTaskModal
filterDiv: document.getElementById('filterDiv'),
hideSideBarBtn: document.getElementById('hide-side-bar-btn'),
showSideBarBtn: document.getElementById('show-side-bar-btn'),
themeSwitch: document.getElementById('switch'),
createNewTaskBtn: document.getElementById('add-new-task-btn'),
modalWindow: document.querySelector('.modal-window'), // fixed error by changing getElementsByClassName to query Selector since former returns a live HTML collection

}

let activeBoard = ""

// Extracts unique board names from tasks
// TASK: FIX BUGS
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks(); //retrieves the tasks
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))]; //extracts unique board names from the tasks
  displayBoards(boards);
  if (boards.length > 0) {
    const localStorageBoard = JSON.parse(localStorage.getItem("activeBoard"));
    activeBoard = localStorageBoard ? localStorageBoard : boards[0]; 
    elements.headerBoardName.textContent = activeBoard
    styleActiveBoard(activeBoard)
    refreshTasksUI();
  }
}


// Creates different boards in the DOM
// TASK: Fix Bugs
function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = ''; // Clears the container
  boards.forEach(board => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");
    boardElement.addEventListener( 'click', () => { 
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board //assigns active board
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard))
      styleActiveBoard(activeBoard)
    });
    boardsContainer.appendChild(boardElement);
  });

}

// Filters tasks corresponding to the board name and displays them on the DOM.
// TASK: Fix Bugs
function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks(); // Fetch tasks from a simulated local storage function
  const filteredTasks = tasks.filter(task => task.board === boardName); // gives an array containing only the board names and assigns the value to board name?

  // Ensure the column titles are set outside of this function or correctly initialized before this function runs

  (elements.columnDivs).forEach(column => {
    const status = column.getAttribute("data-status");
    // Reset column content while preserving the column title
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = document.createElement("div");
    column.appendChild(tasksContainer);

    filteredTasks.filter(task => task.status === status).forEach(task => { 
      const taskElement = document.createElement("div");
      taskElement.classList.add("task-div");
      taskElement.textContent = task.title;
      taskElement.setAttribute('data-task-id', task.id);

      // Listen for a click event on each task and open a modal
      taskElement.addEventListener('click', () => { 
        openEditTaskModal(task);
      });

      tasksContainer.appendChild(taskElement);
    });
  });
}


function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

// Styles the active board by adding an active class
// TASK: Fix Bugs
function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => { 
    
    if(btn.textContent === boardName) {
      btn.classList.add('active') 
    }
    else {
      btn.classList.remove('active'); 
    }
  });
}


function addTaskToUI(task) {
  const column = document.querySelector(`.column-div[data-status="${task.status}"]`); 
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
  }

  let tasksContainer = column.querySelector('.tasks-container');
  if (!tasksContainer) {
    console.warn(`Tasks container not found for status: ${task.status}, creating one.`);
    tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title; // Modify as needed
  taskElement.setAttribute('data-task-id', task.id);

  taskElement.addEventListener('click', () => {
    openEditTaskModal(task.id);
  })
  
  tasksContainer.appendChild(taskElement); 
}



function setupEventListeners() {

  // Cancel editing task event listener
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  cancelEditBtn.onclick = () => ( toggleModal(false, elements.editTaskModal)); // bug: click property isn't a method to assign handlers

  // Cancel adding new task event listener
  const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');
  cancelAddTaskBtn.addEventListener('click', () => {
    toggleModal(false, elements.newTaskModal);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
  });

 

  // Clicking outside the modal to close it
  elements.filterDiv.addEventListener('click', () => {
    toggleModal(false, elements.modalWindow);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
  });

  // Show sidebar event listener
  elements.hideSideBarBtn.onclick= () => toggleSidebar(false);
  elements.showSideBarBtn.onclick= () => toggleSidebar(true);

  // Theme switch event listener
  elements.themeSwitch.addEventListener('change', toggleTheme); // NOTE!!

  // Show Add New Task Modal event listener
  elements.createNewTaskBtn.addEventListener('click', () => {
    toggleModal(true, elements.newTaskModal);
    elements.filterDiv.style.display = 'block'; // Also show the filter overlay
  });

  // Add new task form submission event listener
  elements.newTaskModal.addEventListener('submit', (event) => {
    addTask(event)
  });
}

// Toggles tasks modal
// Task: Fix bugs
function toggleModal(show, modal) { // bug: always toggles the NewTaskModel regardless of the model parameter

  modal.style.display = show ? 'block' : 'none'; 
  elements.filterDiv.style.dsiplay = 'none'
}

/*************************************************************************************************************************************************
 * COMPLETE FUNCTION CODE
 * **********************************************************************************************************************************************/

function addTask(event) {

  event.preventDefault();  //prevents the default behaviour of an event from occuring. prevents the browser from reloading the page and sending the form ata to the server.

  //Assign user input to the task object
    const task = {
      title: document.getElementById('modal-title-input').value,
      description: document.getElementById('modal-desc-input').value,
      newStatus: document.getElementById('select-status').value, 
      board: activeBoard // bug: board assignment was missing   
    };
    const newTask = createNewTask(task);
    if (newTask) {
      addTaskToUI(newTask);
      toggleModal(false, elements.newTaskModal);
      elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
      event.target.reset();
      refreshTasksUI();
    
    }
}


function toggleSidebar(show) {
  const sidebar = document.getElementById('side-bar-div');

  sidebar.style.display = show ? 'block' : 'none'; // toggles the sidebar's visiblity using the display property.

  //Update local storage
  localStorage.setItem('showSideBar', show.toString());
 
}

function toggleTheme() {
  const body = document.body; // references to body element
  body.classList.toggle('light-theme')
  // save the theme preferences to local storage
  const isLightTheme = body.classList.contains('light-theme')
  localStorage.setItem('theme', isLightTheme ? 'light': 'dark')
 
}
function getTaskFromLocalStorage(taskId) {
  const tasks = JSON.parse(localStorage.getItem('tasks'));
  return tasks.find((task) => String(task.id) === String(taskId)); //taskId passed to it might be a string
}


function openEditTaskModal(taskId) {
const task = getTaskFromLocalStorage(taskId);
if (task) {
 // Set task details in modal inputs
 const modalTitleInput = document.getElementById('edit-task-title-input');
 const modalDescriptionInput = document.getElementById('edit-task-desc-input');
 const modalStatusSelect = document.getElementById('edit-select-status');

 modalTitleInput.value = task.title;
 modalDescriptionInput.value = task.description;
 modalStatusSelect.value = task.status;

 // Get button elements from the task modal
 const saveChangesBtn = document.getElementById('save-task-changes-btn');
 const deleteTaskBtn = document.getElementById('delete-task-btn');
 const cancelBtn = document.getElementById('cancel-edit-btn');


 // Call saveTaskChanges upon click of Save Changes button
 saveChangesBtn.onclick = () => {
  saveTaskChanges(taskId);

 } 

 // Delete task using a helper function and close the task modal

 deleteTaskBtn.onclick = () => {
   deleteTask(taskId)
   toggleModal(false, elements.editTaskModal); 
 };

 cancelBtn.onclick = () => {
   toggleModal(false, elements.editTaskModal); 
 }


}

toggleModal(true, elements.editTaskModal); // Show the edit task modal
}

function saveTaskChanges(taskId) {
  // Get new user inputs

  const titleUpdate = document.getElementById('edit-task-title-input').value;
  const descriptionUpdate = document.getElementById('edit-task-desc-input').value;
  const statusUpdate = document.getElementById('edit-select-status').value;
  

  // Create an object with the updated task details
  const updatedTasks = {
    title: titleUpdate,
    description: descriptionUpdate,
    status: statusUpdate,
  }


  // Update task using a helper function
  patchTask(taskId, updatedTasks);

  // Close the modal and refresh the UI to reflect the changes
  toggleModal(false, elements.editTaskModal);
  refreshTasksUI();
}

/*************************************************************************************************************************************************/

document.addEventListener('DOMContentLoaded', function() {
  init(); // init is called after the DOM is fully loaded
});

function init() {
  setupEventListeners();
  const showSidebar = localStorage.getItem('showSidebar') === 'true';
  toggleSidebar(showSidebar);
  const isLightTheme = localStorage.getItem('light-theme') === 'enabled';
  document.body.classList.toggle('light-theme', isLightTheme);
  fetchAndDisplayBoardsAndTasks(); // Initial display of boards and tasks
}



