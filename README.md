Monocle API Client for JavaScript
=================================

```js
var app = angular.module('app', ['monocle']);

app.config(function(monocleProvider) {
    monocleProvider.setBase('/api');
});

app.service('Users', function(monocle) {
    this.get = function(userId) {
        return monocle.get('/users/' + userId, {
            params: ['userId', 'displayName', 'age']
        });
    };
});

app.controller('UsersCtrl', function($scope, Users) {
    $scope.user = null;
    $scope.error = null;
    Users.get(123)
    .then(function(user) {
        $scope.user = user;
    })
    .catch(function(error) {
        $scope.error = error;
    });
});
```
