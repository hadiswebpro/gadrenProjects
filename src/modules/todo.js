export function toDoManager(){

    function makeToDo(title, description, dueDate, priority, notes){

        return {
            title,
            description,
            dueDate,
            priority,
            notes,
            completed : false,
            id : crypto.randomUUID()

        };
    }

    function deleteToDo(todos, id) {

        return todos.filter(
            todo => todo.id !== id
        );
    }

    function editToDo(todos, id, newtitle, newdescription, newdueDate, newpriority, newnotes) {

        const todo = todos.find(
            todo => todo.id === id
        );

        if (!todo) return todos;

        todo.title = newtitle;
        todo.description = newdescription;
        todo.priority = newpriority;
        todo.notes = newnotes;
        todo.dueDate = newdueDate;

        return todos;

    }


    function toggleComplete(todos, id){
   
        const todo = todos.find(
            todo => todo.id === id
        );

        if(!todo) return todos;

        todo.completed = !todo.completed;

        return todos;

    }


    function openToDo(todos, id){

        return todos.find(
            todo => todo.id === id
        );
    }
    return{

        makeToDo,
        deleteToDo,
        editToDo,
        toggleComplete,
        openToDo
    }
}