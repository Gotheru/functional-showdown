Usage
-

To use this template to create new immutable classes without writing down all of the boilerplate, just run
```aiignore
npx hygen new-record new-record --name [Name] --props "[Arg1]:[T1],[Arg2]:[T2]..."
```
This will create:
- An interface `NameParams` that contains all the parameters given in `--props` that the main class will use.
- An immutable class `Name` with a default valued constructor and a method, `get` and `set` for all of its parameters
and the method `with` that lets you create new instances of the class by modifying a previous object of that class.
