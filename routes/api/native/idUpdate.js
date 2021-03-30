const Promise = require('bluebird');

module.exports = (api) => {
  /**
   * Updates an ID given information
   * @param {String} coin The chainTicker of the coin that the ID is based on
   * @param {String} name The name of the ID to reserve
   * @param {String[]} primaryaddresses An array of the primary addresses for this id
   * @param {Number} minimumsignatures The minimum signatures required to sign a tx for this ID
   * @param {Object} contentmap The content to initially attach to this id
   * @param {String} revocationauthority The ID that can revoke this ID
   * @param {String} recoveryauthority The ID that can recover this ID
   * @param {String} privateaddress The private address attached to this ID
   */
  api.native.update_id = (
    coin,
    name,
    primaryaddresses,
    minimumsignatures = 1,
    contentmap = null,
    revocationauthority,
    recoveryauthority,
    privateaddress,
  ) => {
    let idJson = {
      name,
      primaryaddresses,
      minimumsignatures,
      contentmap: contentmap,
      revocationauthority,
      recoveryauthority,
      privateaddress
    }

    if (privateaddress == null) {
      delete idJson.privateaddress
    }

    return new Promise((resolve, reject) => {
      api.native
        .callDaemon(
          coin,
          "getidentity",
          [idJson.name]
        )
      .then(idObj => {
        if (!idObj) throw new Error(`${idJson.name} ID not found.`)
        idJson.parent = idObj.identity.parent
        idJson.identityaddress = idObj.identity.identityaddress
        idJson.version = idObj.identity.version
        idJson.contentmap = contentmap == null ? idObj.contentmap : contentmap;

        return api.native
        .callDaemon(
          coin,
          "updateidentity",
          [idJson]
        )
      })
      .then(idUpdateResult => {
        resolve({
          chainTicker: coin,
          ...idJson,
          resulttxid: idUpdateResult
        })
      })
      .catch(err => {
        reject(err);
      });
    });
  };

  //TODO: Add more checks in here as well
  api.native.update_id_preflight = (
    coin,
    name,
    primaryaddresses,
    minimumsignatures = 1,
    contentmap = null,
    revocationauthority,
    recoveryauthority,
    privateaddress,
  ) => {
    return new Promise((resolve, reject) => {
      resolve({
        chainTicker: coin,
        name,
        primaryaddresses,
        minimumsignatures,
        contentmap,
        revocationauthority,
        recoveryauthority,
        privateaddress,
      })
    });
  };

  api.setPost('/native/update_id', (req, res, next) => {
    const {
      chainTicker,
      name,
      primaryaddresses,
      minimumsignatures,
      contentmap,
      revocationauthority,
      recoveryauthority,
      privateaddress,
    } = req.body;

    api.native
      .update_id(
        chainTicker,
        name,
        primaryaddresses,
        minimumsignatures,
        contentmap,
        revocationauthority,
        recoveryauthority,
        privateaddress,
      )
      .then(updateObj => {
        const retObj = {
          msg: "success",
          result: updateObj
        };

        res.send(JSON.stringify(retObj));
      })
      .catch(error => {
        const retObj = {
          msg: "error",
          result: error.message
        };

        res.send(JSON.stringify(retObj));
      });
  });

  api.setPost('/native/update_id_preflight', (req, res, next) => {
    const {
      chainTicker,
      name,
      primaryaddresses,
      minimumsignatures,
      contentmap,
      revocationauthority,
      recoveryauthority,
      privateaddress,
    } = req.body;

    api.native
      .update_id_preflight(
        chainTicker,
        name,
        primaryaddresses,
        minimumsignatures,
        contentmap,
        revocationauthority,
        recoveryauthority,
        privateaddress,
      )
      .then(idUpdateResult => {
        const retObj = {
          msg: "success",
          result: idUpdateResult
        };

        res.send(JSON.stringify(retObj));
      })
      .catch(error => {
        const retObj = {
          msg: "error",
          result: error.message
        };

        res.send(JSON.stringify(retObj));
      });
  });

  return api;
};
