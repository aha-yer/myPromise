function Promise(executor) {
  this.PromiseStatus = "pending";
  this.PromiseResult = undefined;
  this.callback = [];

  const self = this;

  function res(value) {
    if (self.PromiseStatus !== "pending") return;

    if (value instanceof Promise) {
      self.PromiseStatus = value.PromiseStatus;
      switch (self.PromiseStatus) {
        case "fulfilled":
          self.PromiseResult = value.PromiseResult;
          break;
        case "rejected":
          self.PromiseResult = value.PromiseResult;
          break;
        default:
          value
            .then((result) => {
              self.PromiseResult = result;
              self.PromiseStatus = "fulfilled";
            })
            .catch((error) => {
              self.PromiseResult = error;
              self.PromiseStatus = "rejected";
            });
          break;
      }
    } else {
      self.PromiseStatus = "fulfilled";
      self.PromiseResult = value;
    }

    queueMicrotask(() => {
      self.callback.forEach((item) => {
        item.onResolved(value);
      });
    });
  }

  function rej(reason) {
    if (self.PromiseStatus !== "pending") return;

    if (reason instanceof Promise) {
      self.PromiseStatus = reason.PromiseStatus;
      switch (self.PromiseStatus) {
        case "fulfilled":
          self.PromiseResult = reason.PromiseResult;
          break;
        case "rejected":
          self.PromiseResult = reason.PromiseResult;
          break;
        default:
          reason
            .then((result) => {
              self.PromiseResult = result;
              self.PromiseStatus = "fulfilled";
            })
            .catch((error) => {
              self.PromiseResult = error;
              self.PromiseStatus = "rejected";
            });
          break;
      }
    } else {
      self.PromiseStatus = "rejected";
      self.PromiseResult = reason;
    }

    queueMicrotask(() => {
      self.callback.forEach((item) => {
        item.onRejected(reason);
      });
    });
  }

  try {
    executor(res, rej);
  } catch (e) {
    rej(e);
  }
}

Promise.resolve = function (value) {
  if (value instanceof Promise) {
    return value;
  }
  return new Promise((res, _) => res(value));
};

Promise.reject = function (reason) {
  return new Promise((_, rej) => rej(reason));
};

Promise.all = function (arr) {
  let res = [];
  for (v of arr) {
    if (v.PromiseStatus === "rejected") return Promise.reject(v.PromiseResult);
    res.push(v.PromiseResult);
  }
  return Promise.resolve(res);
};

Promise.race = function (arr) {
  if (!arr || arr.length === 0) return null;
  let res = arr.find((val) => val.PromiseStatus !== "pending");
  if (!res) {
    let status = res.PromiseStatus;
    let result = res.PromiseResult;
    if (status === "fulfilled") return Promise.resolve(result);
    else return Promise.reject(result);
  } else {
    return new Promise(() => {});
  }
};

Promise.prototype.then = function (onResolved, onRejected) {
  const self = this;

  if (typeof onResolved !== "function") {
    onResolved = (value) => value;
  }

  if (typeof onRejected !== "function") {
    onRejected = (reason) => {
      throw reason;
    };
  }

  return new Promise((resolve, reject) => {
    const data = self.PromiseResult;
    const status = self.PromiseStatus;

    function callback(fn) {
      let res;
      try {
        if (!fn) res = self;
        else res = fn(self.PromiseResult);

        if (res instanceof Promise) {
          if (res.PromiseStatus === "fulfilled") resolve(res.PromiseResult);
          else if (res.PromiseStatus === "rejected") reject(res.PromiseResult);
          else {
            res
              .then((result) => {
                resolve(result);
              })
              .catch((e) => {
                reject(e);
              });
          }
        } else {
          resolve(res);
        }
      } catch (e) {
        reject(e);
      }
    }

    if (status === "fulfilled") {
      // 异步执行
      queueMicrotask(() => {
        callback(onResolved);
      });
    } else if (status === "rejected") {
      // 异步执行
      queueMicrotask(() => {
        callback(onRejected);
      });
    } else {
      // push：绑定多个 then 时都能执行
      // 防止后面 then 的回调函数覆盖前面 then 的回调函数
      // 异步执行
      queueMicrotask(() => {
        this.callback.push({
          // 闭包: 延长作用域存活时间
          onResolved: function () {
            callback(onResolved);
          },
          onRejected: function () {
            callback(onRejected);
          },
        });
      });
    }
  });
};

Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
};

const p = new Promise((resolve, reject) => {
  // resolve();
  // resolve(
  //   new Promise((resolve, reject) => {
  //     // resolve("ok");
  //     // reject("no");
  //     throw new Error("no");
  //   })
  // );
  reject(
    new Promise((resolve, reject) => {
      // resolve("ok");
      // reject("no");
      throw new Error("no");
    })
  );
})
  // .then((result) => {
  //   // console.log("result:", result);
  //   return new Promise((res, rej) => {
  //     setTimeout(() => {
  //       // res("ok");
  //       rej('no')
  //     });
  //   });
  // })
  .then((result) => {
    console.log("result:", result);
  })
  .catch((e) => {
    console.log("error:", e);
  });
