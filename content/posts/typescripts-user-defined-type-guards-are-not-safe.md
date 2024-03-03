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

While it is true that having a check rather than just blindly hoping that `pet` is a `Dog`, I think that the type predicate `pet is Dog` is no safer than the assertion `pet as Dog` because Typescript does not actually type check that the implementation satisfies that `pet` is a `Dog`.

User-defined type guards are a type hole that still leaves open the chances of making a mistake and giving data an incorrect type. Mistakes could be made during implementation, or changes over time could mean that the correct check today will be wrong tomorrow and you'll have no way of knowing because it's not type checked. `pet is Dog` is just as unsafe as `pet as Dog` . When the whole point of Typescript is to have the computer _prove_ that your code is correct, using features that say "no trust me bro" erode the reliability of your code

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