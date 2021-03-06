'use strict';

function spyFactoryFactory(
    signet,
    sinon
) {
    const isString = signet.isTypeOf('string');
    const isExistant = signet.isTypeOf('existant');


    function factory(stubcontractor) {
        function getEndPointName(endPoint) {
            if (signet.isTypeOf('array')(endPoint)) {
                return endPoint[0];
            }
            return endPoint;
        }

        function spyFactory(moduleFile, apiEndPoints, moduleName) {
            let fake = stubcontractor.getApiEndpoints(moduleFile, apiEndPoints.map(getEndPointName));
            fake.__name = isExistant(moduleName) ? moduleName : moduleFile;

            apiEndPoints.forEach(function (endPoint) {
                let name = getEndPointName(endPoint);
                let func = undefined;

                if (signet.isTypeOf('array')(endPoint)) {
                    func = endPoint[1];
                }

                if (Boolean(fake[name])) {
                    if (isString(endPoint) || endPoint.length < 3 || (endPoint[2])) {
                        fake[name].onCall(sinon.spy(func));
                    } else {
                        fake[name].onCall(func);
                    }

                    fake[name].renameTo = function (newName) {
                        fake[newName] = fake[name];
                        fake[name] = undefined;
                    };
                }
                else {
                    throw new Error(`'${name}' function does not exist`);
                }
            });

            return fake;
        }

        const isFunction = signet.isTypeOf('function');

        function callCallback(error, data) {
            return function (...args) {
                let callback = args.pop();
                if (isFunction(callback)) {
                    if (isExistant(error) || isExistant(data)) {
                        callback(error, data);
                    } else {
                        callback();
                    }
                }
            };
        }

        function callCallbackVia(wrapper) {
            return function (...args) {
                let callback = args.pop();
                if (isFunction(callback)) {
                    wrapper(callback);
                }
            };
        }

        spyFactory.callCallback = signet.enforce(
            'error:maybe<*>, data:maybe<*> => function<() => undefined>',
            callCallback
        );

        spyFactory.callCallbackVia = signet.enforce(
            'wrapper:function<callback => undefined> => function',
            callCallbackVia
        );

        return signet.enforce(
            'moduleFile:string, apiEndPoints:apiEndPoints, maybe<moduleName:name> => fakeObject',
            spyFactory
        );
    }

    return factory;
}

module.exports = spyFactoryFactory;