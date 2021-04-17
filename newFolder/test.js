const express = require('express'),
    bodyParser = require('body-parser'),
    uuid = require('uuid');

const app = express();

app.use(bodyParser.json());

//students as an array of objects
let students = [{
        id: 1,
        name: 'Jessica Drake',
        classes: {
            biology: 95,
            algebra: 92
        }
    },
    {
        id: 2,
        name: 'Ben Cohen',
        classes: {
            biology: 95,
            algebra: 92
        }
    },
    {
        id: 3,
        name: 'Lisa Downing',
        classes: {
            biology: 95,
            algebra: 92
        }
    },
];
// gets the list of data about ALL students

app.get('/students', (req, res) => {
    res.json(students);
});

//gets the data about a single student, by name
app.get('/students/:name', (req, res) => {
    res.json(students.find((student) => { return student.name === req.params.name }));
})

// adds data for a new student to list of students
app.post('/students', (req, res) => {
    let newStudent = req.body;

    if (!newStudent.name) {
        const message = 'Missing name in request body';
        res.status(400).send(message);
    } else {
        newStudent.id = uuid.v4();
        students.push(newStudent);
        res.status(201).send(newStudent);
    }
});

// deletes a student from list by ID
app.delete('/students/:id', (req, res) => {
    let student = students.find((student) => {
        return student.id === req.params.id
    });
    if (student) {
        students = students.filter((obj) => {
            return obj.id !== req.params.id
        });
        res.status(201).send('studnet ' + req.params.id + ' was deleted.')
    }
});

//update the grade of studnet by student name/class name
app.put('/studnents/:name/:class/:grade', (req, res) => {
    let student = students.find((student) => {
        return student.name === req.params.name
    });
    if (student) {
        student.classes[req.params.class] = parseInt(req.params.grade);
        res.status(201).send('Student ' + req.params.name + ' was assigned a grade of ' + req.params.grade + ' in ' + req.params.class);
    } else {
        res.status(404).send('student with the name ' + req.params.name + ' was not found');
    }
});

//gets the gpa of a student
app.get('/students/:name/gpa', (req, res) => {
    let student = students.find((student) => {
        return student.name === req.params.name
    });
    if (student) {
        let classesGrades = Object.values(student.classes);
        // object.values() filters out an object's keys and keeps the values that are returned as a new array
        let sumOfGrades = 0;
        classesGrades.forEach(grade => {
            sumOfGrades = sumOfGrades + grade;
        });
        let gpa = sumOfGrades / classesGrades.length;
        console.log(sumOfGrades);
        console.log(classesGrades.length);
        console.log(gpa);
        res.status(201).send('' + gpa);
        //res.status.send(gpa);
    } else {
        res.status(404).send('Student with the name ' + req.params.name + ' was not found');
    }
});

app.listen(8080, () => {
    console.log('your app is listening on port 8080')
})