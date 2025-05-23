const activeMonitorService = require("./activeMonitorService.js");
const incidentService = require("./incidentService");
const statusPageService = require("./statusPageService");

const Monitor = require("../models/Monitor.js");

const getMonitors = async (orgId) => {
  try {
    const monitors = await Monitor.find({
      orgId: orgId,
    });
    return monitors;
  } catch (error) {
    throw new Error("Failed to get monitors: " + error.message);
  }
};

const createMonitor = async (data) => {
  try {
    const newMonitor = new Monitor(data);
    await newMonitor.save();

    // If Active, add to ActiveMonitor
    if (newMonitor.active) {
      try {
        await activeMonitorService.createActiveMonitor({
          orgId: newMonitor.orgId,
          monitorId: newMonitor._id,
          link: newMonitor.link,
        });
      } catch (error) {
        throw new Error("Failed to create active monitor: " + error.message);
      }
    }

    return newMonitor;
  } catch (error) {
    throw new Error("Failed to create monitor: " + error.message);
  }
};

const updateMonitor = async (data) => {
  try {
    const monitorToUpdate = await Monitor.findById(data._id);
    if (
      monitorToUpdate.orgId.toString() !== data.orgId.toString() ||
      monitorToUpdate._id.toString() !== data._id.toString()
    ) {
      throw new Error("Unauthorized");
    }
    const oldLink = monitorToUpdate.link;
    Object.assign(monitorToUpdate, data);
    await monitorToUpdate.save();

    const activeMonitorExists = await activeMonitorService.activeMonitorExists(
      monitorToUpdate._id
    );

    try {
      if (!activeMonitorExists && monitorToUpdate.active) {
        // If Active, add to ActiveMonitor
        await activeMonitorService.createActiveMonitor({
          orgId: monitorToUpdate.orgId,
          monitorId: monitorToUpdate._id,
          link: monitorToUpdate.link,
        });
      } else if (activeMonitorExists && !monitorToUpdate.active) {
        // If not Active, delete from ActiveMonitor
        await activeMonitorService.deleteActiveMonitor({
          monitorId: monitorToUpdate._id,
          orgId: monitorToUpdate.orgId,
        });
      } else if (activeMonitorExists && monitorToUpdate.active) {
        // Update link, delete and insert
        if (oldLink != monitorToUpdate.link) {
          await activeMonitorService.deleteActiveMonitor({
            monitorId: monitorToUpdate._id,
            orgId: monitorToUpdate.orgId,
          });
          await activeMonitorService.createActiveMonitor({
            orgId: monitorToUpdate.orgId,
            monitorId: monitorToUpdate._id,
            link: monitorToUpdate.link,
          });
        }
      } else {
        // Do nothing
      }
    } catch (error) {
      throw new Error("Failed to update active monitor: " + error.message);
    }

    return monitorToUpdate;
  } catch (error) {
    throw new Error("Failed to update monitor: " + error.message);
  }
};

const deleteMonitor = async (data) => {
  try {
    const monitorToDelete = await Monitor.findById(data._id);
    if (
      monitorToDelete.orgId.toString() !== data.orgId.toString() ||
      monitorToDelete._id.toString() !== data._id.toString()
    ) {
      throw new Error("Unauthorized");
    }

    // Remove from StatusPages
    await statusPageService.removeMonitors({
      orgId: monitorToDelete.orgId,
      monitor: monitorToDelete._id,
    });
    await Monitor.findByIdAndDelete(data._id);

    // If in ActiveMonitor, delete ActiveMonitor
    const activeMonitorExists = await activeMonitorService.activeMonitorExists(
      monitorToDelete._id
    );
    if (activeMonitorExists) {
      try {
        await activeMonitorService.deleteActiveMonitor({
          monitorId: monitorToDelete._id,
          orgId: monitorToDelete.orgId,
        });
      } catch (error) {
        throw new Error("Failed to delete active monitor: " + error.message);
      }
    }

    // If Incidents exist, delete Incidents
    await incidentService.deleteIncidents({ monitor: monitorToDelete._id });

    return monitorToDelete;
  } catch (error) {
    throw new Error("Failed to delete monitor: " + error.message);
  }
};

module.exports = {
  getMonitors,
  createMonitor,
  updateMonitor,
  deleteMonitor,
};
