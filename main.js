function AsyncTask(user) {
  return new Promise(resolve => {
    console.log('Adding user to DB: ' + user);
    setTimeout(() => {
      resolve('Added: ' + user);
    }, 2 * 1000);
  });      
}

const FutureAsyncTask = (args) => ({run: () => AsyncTask(args)});

// Enables syntactic sugar of writing ES7 async / await style synchronous
// looking code using generators, encapsulating and inversion-of-control
// of the iterator.
const coroutine = generator => {
  const iterator = generator();
  // Lazily generates the sequential promise chain from the iterator elements.
  const continuation = result => {
    !result.done && result.value.then && result.value.then(
      res => continuation(iterator.next(res)),
      err => continuation(iterator.throw(err))
    );
  };
  // TODO: Be fancy and used a self-invocating lazy fixed-point Y-combinator.
  continuation(iterator.next());
  // TODO: Be really fancy and have recursive generators operating on "fractal graph" of nested
  // async tasks. ie: monadic lift / deep flatMap
};

// Executes a topological ordering with task nodes at each level done in parallel,
// and level n+1 executed only if all tasks at level n successfuly resolved.
function Schedule(...schedule) {
  coroutine(function * () {
    try {
      // Cannot use array.protoype.map / forEach. Yield statements within these
      // lexical closures are syntactic errors. Yield statements are only valid
      // within generator functions.
      for(let i = 0; i < schedule.length; i++) {
    	const step = schedule[i];
        const promises = step.map(future => future.run());
        yield Promise.all(promises);
      }
    } catch (err) {
      console.log(err.message);
    }
  });
  
  // Can't extract return values out of generator unless the invocator
  // is wrapped inside a generator, too.
  // return ;
}

Schedule(
  [FutureAsyncTask('a'), FutureAsyncTask('b')], // Executed in parallel
  [FutureAsyncTask('c')], // Waits for process synchronization from previous step.
  [FutureAsyncTask('d'), FutureAsyncTask('e')],
  [FutureAsyncTask('f')],
);

