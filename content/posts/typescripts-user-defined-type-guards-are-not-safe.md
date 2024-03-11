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

This results in a function that when called, will validate and input and narrow the argument down to Dog. We're no longer just blindly trusting that pet is Dog. Problem solved, right?

Unfortunately, type guards aren't actually checked by Typescript - there's no relation between pet is Dog and the implementation. It could just blindly return `true` and Typescript wouldn't care. Now all cats are dogs! User-defined type guards are a type hole that increases the chances of making a mistake and incorrectly typing data as it flows through your system. When the entire point of Typescript is to tell you where you've made a mistake, this pattern works against that.

In fact, because Typescript is able to naturally narrow unions in if-statements, moving an existing check into a type guard function can _remove_ type safety. In the following code, the first example is actively checked by Typescript's type system where developer-mistakes will be caught and will catch errors as the application changes over time. The second example is suspectable to mistakes that will go uncaught until it breaks the application for users.


```ts title="better.ts"
const pet: Fish | Bird = getPet();

if ("swim" in pet) {
    // pet has been narrowed to Fish here
}
```

```ts title="worse.ts"
function isFish(pet: Fish | Bird): pet is Bird {
    return "swim" in pet
}

if (isFish(pet)) {
    // We hope pet is Fish here, but when copying it into a seperate function, we accidentally made a mistake!
}
```
The opportunity for introducing mistakes becomes more apparent with more realistic patterns such as discriminated union with more members with similar names.

```ts
type QueryVariable = { type: 'query-variable', ... };
type AdHocVariable = { type: 'adhoc-variable', ... };
type MultiAdHocVariable = { type: 'multiadhoc-variable', ... };
type CustomVariable = { type: 'custom-variable', ... };
type ConstantVariable = { type: 'constant-variable', ... };
type Variable =
  | QueryVariable
  | AdHocVariable
  | MultiAdHocVariable
  | CustomVariable
  | ConstantVariable;

function isCustomVariable(variable: Variable): variable is CustomVariable {
  return variable.type === "constant-variable"
}
```


So, instead of user-defined type guards, what do we do instead?

## Runtime validation library

Solutions such as [zod](https://zod.dev/), [io-ts](https://github.com/gcanti/io-ts), or [typia](https://typia.io/docs/validators/assert/) allow developers to validate unknown against a schema at runtime.

They're most commonly used when accepting incoming untrusted data and parsing it to a known shape. 

```ts
import { z } from "zod";

const CustomVariable = z.object({
  type: z.literal("custom-variable"),
  query: z.string()
});

const result = CustomVariable.parse({ type: "custom-variable", query: "SELECT name FROM pets" });

if (result.success) {
  // We now know that result.data is a valid CustomVariable
}
```


## Narrowing

Sometimes though your data has already been parsed, but it's still one of a few possible values (such as the first is `isDog` example). When your data is sufficiently modeled using discriminated unions, Typescript is able to just naturally narrow it down using properties that are unique between each member.

```ts
const variable: Variable = getVariable();

if (variable.type === "custom-variable") {
  // Typescript will narrow `variable` down to all possible types inside this clause.
  // In this case it's just `CustomVariable`  
}
```

While I prefer this style less, you're even able to check on implicit differences between objects.

```ts
const variable: Variable = getVariable();

if ("query" in variable) {
  // Variable has been narrowed down to `QueryVariable |  CustomVariable`, so we can act on properties that are the same on both
  console.log("Query is", variable.query, "characters long")
}
```

Because this is checked by the type system, Typescript will be able to tell us if we've made a mistake (such as mispelling a type), or if our application changes over time.





-----------

However, this narrowing is not actually checked by Typescript - there's no relation between `pet is Dog` and the implementation of the function. You could just blindly return `true` all the time, and Typescript would happily declare pet is a Dog!

```ts
function isDog(pet: Cat | Dog): pet is Cat /* Oops! */ { 
  return "woof" in pet;
}
```

User-defined type guards are a type hole that still leaves open the chances of making a mistake and giving data an incorrect type. Mistakes could be made during implementation, or changes over time could mean that the correct check today will be wrong tomorrow and you'll have no way of knowing because it's not type checked. `pet is Dog` is just as unsafe as `pet as Dog` . When the whole point of Typescript is to have the computer _prove_ that your code is correct, using features that say "no trust me bro" erode the reliability of your code.

In fact, by deleting your type guards you might actually _gain_ safety. Take the following examples - the non-type guard version is type checked and will return errors if your code changes later in a way that invalidates

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