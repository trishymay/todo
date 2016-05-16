var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);
var expect = chai.expect;
var mongoose = require('mongoose');
process.env.MONGO = 'mongodb://localhost/todo_test';
var server = require('../server');
var User = require('../app/models/user');
var Item = require('../app/models/item');
var List = require('../app/models/list');
var makeToken = require('../app/lib/authMiddle.js').makeToken;

describe('user routes', function () {
  after(function (done) {
    mongoose.connection.db.dropDatabase(function () {
      done();
    });
  });

  it('should be able to create a user with a hashed password', function (done) {
    chai.request(server)
      .post('/user/createuser')
      .send({email: 'a@a.com', username: 'coffee', password: 'beans'})
      .end(function (err, res) {
        expect(err).to.eql(null);
        expect(res.body.email).to.eql('a@a.com');
        expect(res.body.username).to.eql('coffee');
        expect(res.body.password).to.not.eql('beans');
        expect(res.body.password).to.be.a('string');
        done();
      });
  });

  it('should error creating a user with an invalid email format', function (done) {
    chai.request(server)
      .post('/user/createuser')
      .send({email: 'com', username: 'abc', password: 'beans'})
      .end(function (err, res) {
        expect(err.status).to.eql(449);
        done();
      });
  });

  it('should error creating a user when missing username', function (done) {
    chai.request(server)
      .post('/user/createuser')
      .send({email: 'a@a.com', username: '', password: 'beans'})
      .end(function (err, res) {
        expect(err.status).to.eql(449);
        done();
      });
  });

  it('should error creating a user when missing email', function (done) {
    chai.request(server)
      .post('/user/createuser')
      .send({email: '', username: 'def', password: 'beans'})
      .end(function (err, res) {
        expect(err.status).to.eql(449);
        done();
      });
  });

  it('should error creating a user when missing password', function (done) {
    chai.request(server)
      .post('/user/createuser')
      .send({email: 'a@a.com', username: 'ghi', password: ''})
      .end(function (err, res) {
        expect(err.status).to.eql(449);
        done();
      });
  });

  describe('user routes requiring a user already in the database', function () {
    var token;
    var expiredToken;
    var sampleUser = {email: 'a@a.com', username: 'cocoa', password: 'beans'};

    before(function (done) {
      User.create(sampleUser, function (err, user) {
        token = makeToken(user, 7200);
        expiredToken = makeToken(user, 1);
      });
      setTimeout(done, 1500);
    });

    beforeEach(function (done) {
      User.findOne({'username': sampleUser.username}, function(err, user) {
        if (!user) {
          User.create(sampleUser, function (err, user) {
            expiredToken = makeToken(user, 1);
          });
          setTimeout(done, 1500);
        } else {
          done();
        }
      });
    });

    it('should log in a user and retrieve token', function (done) {
      chai.request(server)
        .post('/user/signin')
        .send({'username': sampleUser.username, password: sampleUser.password})
        .end(function (err, res) {
          expect(err).to.eql(null);
          expect(res.body.msg).to.eql('User successfully authenticated');
          expect(res.body.token).to.be.a('string');
          done();
        });
    });

    it('should error creating a user when using a duplicate username', function (done) {
      chai.request(server)
        .post('/user/createuser')
        .send(sampleUser)
        .end(function (err, res) {
          expect(err.status).to.eql(409);
          expect(res.body.msg).to.eql('This username already exists');
          done();
        });
    });

    it('should error signing in a user when using a non-existent username', function (done) {
      chai.request(server)
        .post('/user/signin')
        .send({'username': 'lima', password: sampleUser.password})
        .end(function (err, res) {
          expect(err.status).to.eql(449);
          done();
        });
    });

    it('should error signing in a user when using an invalid password', function (done) {
      chai.request(server)
        .post('/user/signin')
        .send({'username': sampleUser.username, password: 'jellybeans'})
        .end(function (err, res) {
          expect(err.status).to.eql(449);
          done();
        });
    });

    it('should get user account info for user associated with attached token', function (done) {
      chai.request(server)
        .get('/user/account')
        .set('token', token)
        .end(function (err, res) {
          expect(err).to.eql(null);
          expect(res.body.username).to.eql(sampleUser.username);
          expect(res.body.email).to.eql(sampleUser.email);
          done();
        });
    });

    it('should error to get account with no token', function (done) {
      chai.request(server)
        .get('/user/account')
        .end(function (err, res) {
          expect(err.status).to.eql(449);
          done();
        });
    });

    it('should error to get account with invalid token', function (done) {
      chai.request(server)
        .get('/user/account')
        .set('token', 'abcd')
        .end(function (err, res) {
          expect(err.status).to.eql(449);
          done();
        });
    });

    it('should update email address for user associated with attached token', function (done) {
      chai.request(server)
        .put('/user/account')
        .set('token', token)
        .send({'newEmail': 'b@b.com', password: sampleUser.password})
        .end(function (err, res) {
          expect(err).to.eql(null);
          expect(res.body.email).to.eql('b@b.com');
          done();
        });
    });

    it('should fail to update email address using invalid email format', function (done) {
      chai.request(server)
        .put('/user/account')
        .set('token', token)
        .send({'newEmail': 'bb.com', password: sampleUser.password})
        .end(function (err, res) {
          expect(err.status).to.eql(449);
          done();
        });
    });

    it('should process get request and give updated token in header' +
    ' for user with expired token and unchanged password', function (done) {
      chai.request(server)
        .get('/user/account')
        .set('token', expiredToken)
        .end(function (err, res) {
          expect(err).to.eql(null);
          expect(res.body.username).to.eql(sampleUser.username);
          expect(res.header.token).to.be.a('string');
          done();
        });
    });

    it('should error to update email with incorrect password', function (done) {
      chai.request(server)
        .put('/user/account')
        .set('token', token)
        .send({'newEmail': 'bb.com', password: 'abc'})
        .end(function (err, res) {
          expect(err.status).to.eql(449);
          done();
        });
    });

    it('should error to update password with incorrect password', function (done) {
      chai.request(server)
        .put('/user/account')
        .set('token', token)
        .send({newPassword: 'lmnop', password: 'abc'})
        .end(function (err, res) {
          expect(err.status).to.eql(449);
          done();
        });
    });

    it('should error to update password with no token', function (done) {
      chai.request(server)
        .put('/user/account')
        .send({'newEmail': 'b@b.com', password: sampleUser.password})
        .end(function (err, res) {
          expect(err.status).to.eql(449);
          done();
        });
    });

    it('should error to update email with no token', function (done) {
      chai.request(server)
        .put('/user/account')
        .send({newPassword: 'abcd', password: sampleUser.password})
        .end(function (err, res) {
          expect(err.status).to.eql(449);
          done();
        });
    });

    it('should error to update email or password with no ' +
      'new email or new password supplied', function (done) {
      chai.request(server)
        .put('/user/account')
        .set('token', token)
        .send({password: sampleUser.password})
        .end(function (err, res) {
          expect(err.status).to.eql(449);
          done();
        });
    });


    it('should return a new token when using expired token and ' +
    ' valid password when updating email', function (done) {
      chai.request(server)
        .put('/user/account')
        .set('token', expiredToken)
        .send({'newEmail': 'b@b.com', password: sampleUser.password})
        .end(function (err, res) {
          expect(err).to.eql(null);
          expect(res.header.token).to.be.a('string');
          done();
        });
    });

    it('should delete a user and all lists and items for that user', function (done) {
      chai.request(server)
        .delete('/user/account')
        .set('token', token)
        .send({'password': sampleUser.password})
        .end(function (err, res) {
          expect(err).to.eql(null);
          expect(res.body.msg).to.eql('User Deleted');
          done();
        });
    });

    it('should error to delete a user with no token', function (done) {
      chai.request(server)
        .delete('/user/account')
        .send({'password': sampleUser.password})
        .end(function (err, res) {
          expect(err.status).to.eql(449);
          done();
        });
    });

    it('should error to delete a user with incorrect password', function (done) {
      chai.request(server)
        .delete('/user/account')
        .set('token', token)
        .send({'password': '1234'})
        .end(function (err, res) {
          expect(err.status).to.eql(449);
          done();
        });
    });

    it('should delete a user with expired token and valid password', function (done) {
      chai.request(server)
        .delete('/user/account')
        .set('token', expiredToken)
        .send({'password': sampleUser.password})
        .end(function (err, res) {
          expect(res.body.msg).to.eql('User Deleted');
          expect(res.header.token).to.eql(undefined);
          done();
        });
    });

    describe('routes requiring a changed password', function () {
      beforeEach(function (done) {
        User.findOne({'username': sampleUser.username}, function(err, user) {
          user.password = 'updated';
          user.save(done);
        });
      });

      it('should error to get account with expired token' +
      ' and changed password', function (done) {
        chai.request(server)
          .get('/user/account')
          .set('token', expiredToken)
          .end(function (err, res) {
            expect(err.status).to.eql(449);
            expect(res.body.msg).to.eql('error - not signed in');
            done();
          });
      });

      it('should update password for user with attached valid token', function (done) {
        chai.request(server)
          .put('/user/account')
          .set('token', token)
          .send({newPassword: 'favabeans', password: 'updated'})
          .end(function (err, res) {
            expect(err).to.eql(null);
            expect(res.body.password).to.be.a('string');
            done();
          });
      });

      it('should update password and return a new token when using' +
      ' expired token and current password', function (done) {
        chai.request(server)
          .put('/user/account')
          .set('token', expiredToken)
          .send({newPassword: 'abcd', password: 'updated'})
          .end(function (err, res) {
            expect(err).to.eql(null);
            expect(res.header.token).to.be.a('string');
            done();
          });
      });
    });
  });
});

