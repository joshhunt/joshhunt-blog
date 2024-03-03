---
title: Typescript's user-defined type guards are not safe
description: They're commonly pointed to as a safer alternative to `as` type
  assertions, but they're just as big as a type hole.
date: 2024-02-20
published: true
---
Occasionally I see people suggest [user-defined type guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) (otherwise known as type predicates) as an safer alternative to `as` [type assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions). They'll see the following code and correctly identify that the `as` type assertions is unsafe and has the potential to introduce bugs:

```ts
const myDog = pet as Dog;
```

Then, they'll try to solve this lack of safety with user-defined type guards such as:

```ts
function isDog(pet: Cat | Dog): pet is Dog {
  return (pet as Dog).woof !== undefined;
}
```

This results in a function that when called, will narrow the argument down to Dog. However, this narrowing is not actually checked by Typescript - there's no relation between `pet is Dog` and the implementation of the function. You could just blindly return `true` all the time, and Typescript would happily declare pet is a Dog!
 
```ts
function isDog(pet: Cat | Dog): pet is Cat /* Oops! */ { 
  return "woof" in pet;
}

```

User-defined type guards are a type hole that still leaves open the chances of making a mistake and giving data an incorrect type. Mistakes could be made during implementation, or changes over time could mean that the correct check today will be wrong tomorrow and you'll have no way of knowing because it's not type checked. `pet is Dog` is just as unsafe as `pet as Dog` . When the whole point of Typescript is to have the computer _prove_ that your code is correct, using features that say "no trust me bro" erode the reliability of your code.

In fact, by deleting your type guards you might actually *gain* safety. Take the following examples - the non-type guard version is type checked and will return errors if your code changes later in a way that invalidates 

```ts
const pet: Cat | Dog = getPet();

if ("purr" in pet) {
  // Typescript has now narrowed pet down to Cat
  pet.purr()
}
```

```ts
const pet: Cat | Dog = getPet();

function isCat(pet: Cat | Dog) {
  return true
}

if (isCat(pet)) {
  // Typescript trusts that we've written isCat correctly. Lets hope we have!
  pet.purr()
}
```

This type of problem is even more likely in common patterns like tagged unions, which in real world examples can have less distinctive names 

```ts
type QueryVariable = { type: 'query-variable', ... };
type AdHocVariable = { type: 'adhoc-variable', ... };
type MultiAdHocVariable = { type: 'multiadhoc-variable', ... };
type CustomVariable = { type: 'custom-variable', ... };
type ConstantVariable = { type: 'constant-variable', ... };
type Variable = QueryVariable | AdHocVariable | MultiAdHocVariable | CustomVariable | ConstantVariable;


function isCustomVariable(variable: Variable): variable is CustomVariable {
    return variable.type === "constant-variable"
}
```


* * *

Ohh I want to take you down to kokomo. We'll get there fast and then we'll take it slow.

Lets say my type names were a bit less obviously named

```ts
function isFish(pet: WaterAnimal | AirAnimal): pet is AirAnimal {
  return "swim" in pet;
}
```

Eek! We've made a mistake, one that typescript _should_ be able to warn us about, but unfortunately lacks the feature to.

This type of problem is even more likely in common patterns like tagged unions

```ts
type Fish = { type: "fish"; swims: true }; // [!code highlight]
type Bird = { type: "bird"; wings: number };
type Animal = Fish | Bird;

Number.parseInt("123", 10);

function isFish(pet: Animal): pet is Fish {
  return pet.type === "bird";
  //         ^?
}
```

```ts
export function foo() {
  console.log("hewwo"); // [!code --]
  console.log("hello"); // [!code ++]
}
```

These are trivial silly examples, but imagine a real application which might have many more union members with less distinctive names.

The whole point of Typescript is that the computer can _prove_ that your code is correct. Typescript does not currently prove user-defined type guards are correct, and thus are a type-hole and remove type safety.