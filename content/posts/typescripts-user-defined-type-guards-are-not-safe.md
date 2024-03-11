---
title: Typescript's user-defined type guards are not safe
description: They're commonly pointed to as a safer alternative to `as` type
  assertions, but they're just as big as a type hole.
date: 2024-02-17
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

In fact, because Typescript is able to naturally narrow unions in if-statements, moving an existing check into a type guard function can _remove_ type safety. The following real-world example will have errors caught through type checking:

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

if (variable.type === "custom-variable") {
  // variable has been narrowed to CustomVariable
}
```

But, if we copy-paste that same check into a type guard, we'll introduce a type hole that can allow mistakes to pass through unnoticed. Can you spot where we made a mistake with auto-complete?

```ts
function isCustomVariable(variable: Variable): variable is ConstantVariable {
  return "custom-variable" in pet;
}

if (isCustomVariable(pet)) {
  // We hope variable is a CustomVariable, but we made a mistake when
  // lifting the check into a separate function!
}
```

Again, because there's no relationship between `variable is CustomVariable` and the body of the function, Typescript isn't smart enough (yet!) to tell us that we've made a mistake here, and incorrectly checked that the argument is a `ConstantVariable`, not a `CustomVariable`

So, instead of user-defined type guards, what do we do instead?

## Narrowing

Sometimes though your data has already been parsed, but it's still one of a few possible values (such as the first is `isDog` example). When your data is sufficiently modeled using discriminated unions, Typescript is able to just naturally narrow it down using properties that are unique between each member.

```ts
const variable: Variable = getVariable();

if (variable.type === "custom-variable") {
  // Typescript will narrow `variable` down to all possible types inside this
  // clause. In this case it's just `CustomVariable`
}
```

While I prefer this style less, you're even able to check on implicit differences between objects:

```ts
const variable: Variable = getVariable();

if ("query" in variable) {
  // Variable has been narrowed down to `QueryVariable |  CustomVariable`, so we
  // can act on properties that are the same on both
  console.log("Query is", variable.query, "characters long");
}
```

Because this is checked by the type system, Typescript will be able to tell us if we've made a mistake (such as mispelling a type), or spot new problems if our application changes over time.

## Parse, don't validate

Sometimes though there is still value in encapsulating our check into a function that we can reuse, especially if the check is more complex (though, I argue that simple `var.type === "foo"` checks are best left inline, not split out into a function). If you squint hard enough, this problem starts to look like [parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/).

Instead of writing functions that return a boolean type predicate (that Typescript can't check), make it (optionally) return the expected type (that Typescript _can_ check!):

```ts
function maybeQueryVariable(input: Variable): QueryVariable | null {
  if (input.type === "query-variable") {
    return input;
  }

  return null;
}
```

Or, if you're feeling extra spicy, drop the `null` and just throw an exception instead!

Because we've specifically annotated the return value, the type system will do the work to ensure that we are correctly returning a value of that type.

## Just keep them!

One specific area where these solutions don't work out is with predicate functions to `arr.filter()`. Because functions don't return their type-narrowing the following doesn't work:

```ts
const queryVariables: QueryVariable[] = variables.filter(
  (v) => v.type === "query-variable"
);
```

There's two overlapping open issues to track improvements to this:

- [Infer arrow function type guard type for specific simple cases](https://github.com/microsoft/TypeScript/issues/38390)
- [Infer type guard => array.filter(x => !!x) should refine Array<T|null> to Array<T>](https://github.com/microsoft/TypeScript/issues/16069)

If you feel comfortable with the tradeoffs of user-defined type guards, you can just keep using them! However, you should limit them to small, easy to read functions that limit opportunities for mistakes to creep in. And test - they should be backed up with loads of (unit) tests to make sure they behave correctly against all possible inputs with a comprehensive set of fixtures.

## Conclusion

User-defined type guards are syntactic sugar around `as` type assertions, and thus Typescript will _trust_ that you implement them correctly and won't check them [by design](https://github.com/microsoft/TypeScript/issues/29980#issuecomment-467945410). This makes them a poor safer alternative to just plain `as`, and introduces opportunities for bugs to creep into code that can't be caught at build time.

Instead, you could prefer inline narrowing checks to make sure that data is the correct shape that you expect. Or, accept the tradeoffs that user-defined type guards brings :)

Runtime validation, through  solutions such as [zod](https://zod.dev/), [io-ts](https://github.com/gcanti/io-ts), or [typia](https://typia.io/docs/validators/assert/) can also be useful, but they are more typically used to parse unknown external input (such as an API response), rather than to distinguish between different parsed types.
