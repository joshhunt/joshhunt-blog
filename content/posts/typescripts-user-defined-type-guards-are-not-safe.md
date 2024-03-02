---
title: Typescript's user-defined type guards are not safe
description: They're commonly pointed to as a safer alternative to `as` type
  assertions, but they're just as big as a type hole.
date: 2024-02-20
published: true
---
Ohh I want to take you down to kokomo. We'll get there fast and then we'll take it slow.

Lets say my type names were a bit less obviously named

```ts
function isFish(pet: WaterAnimal | AirAnimal): pet is AirAnimal {
  return "swim" in pet;
}
```

Eek! We've made a mistake, one that typescript _should_ be able to warn us about, but unfortunately lacks the feature to.

This type of problem is even more likely in common patterns like tagged unions

```ts showLineNumbers title="multiply.js" {3}
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
